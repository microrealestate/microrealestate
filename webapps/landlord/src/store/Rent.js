import { action, computed, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import moment from 'moment';

// workaround for this momentjs behavior:
// As of 2.8.0, changing the global locale doesn't affect existing instances.
// https://momentjscom.readthedocs.io/en/latest/moment/06-i18n/01-changing-locale/
function getMoment(current) {
  if (!current) {
    return moment();
  }
  const locale = moment().locale;
  if (current.locale !== locale) {
    current.locale(locale);
  }
  return current;
}
export default class Rent {
  selected = {};
  filters = { searchText: '', status: '' };
  _period;
  items = [];
  countAll;
  countPaid;
  countPartiallyPaid;
  countNotPaid;
  totalToPay;
  totalPaid;
  totalNotPaid;

  constructor() {
    makeObservable(this, {
      selected: observable,
      filters: observable,
      items: observable,
      countAll: observable,
      countPaid: observable,
      countPartiallyPaid: observable,
      countNotPaid: observable,
      totalToPay: observable,
      totalPaid: observable,
      totalNotPaid: observable,
      period: computed,
      periodAsString: computed,
      filteredItems: computed,
      setSelected: action,
      setFilters: action,
      setPeriod: action,
      fetchWithoutUpdatingStore: flow,
      fetch: flow,
      fetchOneTenantRent: flow,
      fetchTenantRents: flow,
      pay: flow,
      sendEmail: flow,
    });
  }

  get period() {
    this._period = getMoment(this._period);
    return this._period;
  }

  get periodAsString() {
    this._period = getMoment(this._period);
    return this._period.format('YYYY.MM');
  }

  get filteredItems() {
    let filteredItems =
      this.filters.status === ''
        ? this.items
        : this.items.filter(({ status }) => {
            if (status === this.filters.status) {
              return true;
            }

            return false;
          });

    if (this.filters.searchText) {
      const regExp = /\s|\.|-/gi;
      const cleanedSearchText = this.filters.searchText
        .toLowerCase()
        .replace(regExp, '');

      filteredItems = filteredItems.filter(
        ({ occupant: { isCompany, name, manager, contacts }, payments }) => {
          // Search match name
          let found =
            name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
            -1;

          // Search match manager
          if (!found && isCompany) {
            found =
              manager
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) != -1;
          }

          // Search match contact
          if (!found) {
            found = !!contacts
              ?.map(({ contact = '', email = '', phone = '' }) => ({
                contact: contact.replace(regExp, '').toLowerCase(),
                email: email.toLowerCase(),
                phone: phone.replace(regExp, ''),
              }))
              .filter(
                ({ contact, email, phone }) =>
                  contact.indexOf(cleanedSearchText) != -1 ||
                  email.indexOf(cleanedSearchText) != -1 ||
                  phone.indexOf(cleanedSearchText) != -1
              ).length;
          }

          // Search match in payment references
          if (!found) {
            found = !!payments?.find(
              ({ reference = '' }) =>
                reference
                  .replace(regExp, '')
                  .toLowerCase()
                  .indexOf(cleanedSearchText) != -1
            );
          }

          return found;
        }
      );
    }
    return filteredItems;
  }
  setSelected = (rent) => (this.selected = rent);

  setFilters = ({ searchText = '', status = '' }) =>
    (this.filters = { searchText, status });

  setPeriod = (period) => (this._period = period);

  *fetchWithoutUpdatingStore(period = moment()) {
    try {
      const year = period.year();
      const month = period.month() + 1;

      const response = yield apiFetcher().get(`/rents/${year}/${month}`);
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetch() {
    try {
      const response = yield this.fetchWithoutUpdatingStore(this._period);

      this.countAll = response.data.overview.countAll;
      this.countPaid = response.data.overview.countPaid;
      this.countPartiallyPaid = response.data.overview.countPartiallyPaid;
      this.countNotPaid = response.data.overview.countNotPaid;
      this.totalToPay = response.data.overview.totalToPay;
      this.totalPaid = response.data.overview.totalPaid;
      this.totalNotPaid = response.data.overview.totalNotPaid;

      this.items = response.data.rents;
      if (this.selected._id) {
        this.setSelected(
          this.items.find((item) => item._id === this.selected._id) || {}
        );
      }
      return response;
    } catch (error) {
      return error;
    }
  }

  *fetchOneTenantRent(tenantId, term) {
    try {
      const response = yield apiFetcher().get(
        `/rents/tenant/${tenantId}/${term}`
      );

      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchTenantRents(tenantId) {
    try {
      const response = yield apiFetcher().get(`/rents/tenant/${tenantId}`);
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return { status: error?.response?.status };
    }
  }

  *pay(term, payment) {
    try {
      const response = yield apiFetcher().patch(
        `/rents/payment/${payment._id}/${term}`,
        payment
      );
      const rent = response.data;
      const index = this.items.findIndex((item) => item._id === payment._id);
      if (index > -1) {
        this.items.splice(index, 1, rent);
      }
      if (this.selected._id === payment._id) {
        this.setSelected(rent);
      }
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  // payload
  // {
  //   document,
  //   tenantIds,
  //   year,
  //   month
  // }
  *sendEmail(payload) {
    try {
      yield apiFetcher().post('/emails', payload);
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }
}
