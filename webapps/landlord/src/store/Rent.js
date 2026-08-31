import _ from 'lodash';
import { action, computed, flow, makeObservable, observable } from 'mobx';
import moment from 'moment';
import apiClient from '../utils/apiClient';

// workaround for this momentjs behavior:
// As of 2.8.0, changing the global locale doesn't affect existing instances.
// https://momentjscom.readthedocs.io/en/latest/moment/06-i18n/01-changing-locale/
function getMoment(current) {
  return moment(current);
}
export default class Rent {
  constructor() {
    this.selected = {};
    this._period = moment();
    this.items = [];
    this.countAll = undefined;
    this.countPaid = undefined;
    this.countPartiallyPaid = undefined;
    this.countNotPaid = undefined;
    this.totalToPay = undefined;
    this.totalPaid = undefined;
    this.totalNotPaid = undefined;

    makeObservable(this, {
      selected: observable,
      items: observable,
      countAll: observable,
      countPaid: observable,
      countPartiallyPaid: observable,
      countNotPaid: observable,
      totalToPay: observable,
      totalPaid: observable,
      totalNotPaid: observable,
      _period: observable,
      period: computed,
      periodAsString: computed,
      setSelected: action,
      setPeriod: action,
      fetchWithoutUpdatingStore: flow,
      fetch: flow,
      fetchOneTenantRent: flow,
      fetchTenantRents: flow,
      pay: flow,
      sendEmail: flow
    });
  }

  get period() {
    return getMoment(this._period);
  }

  get periodAsString() {
    return this._period.format('YYYY.MM');
  }

  setSelected = (rent) => {
    this.selected = rent;
  };

  setPeriod = (period) => {
    this._period = getMoment(period);
  };

  *fetchWithoutUpdatingStore(period = moment()) {
    try {
      const year = period.year();
      const month = period.month() + 1;

      const response = yield apiClient.get(`/rents/${year}/${month}`);
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }

  *fetch() {
    try {
      const response = yield this.fetchWithoutUpdatingStore(this._period);

      if (
        !_.isEqual(
          [
            this.countAll,
            this.countPaid,
            this.countPartiallyPaid,
            this.countNotPaid,
            this.totalToPay,
            this.totalPaid,
            this.totalNotPaid
          ],
          [
            response.data.overview.countAll,
            response.data.overview.countPaid,
            response.data.overview.countPartiallyPaid,
            response.data.overview.countNotPaid,
            response.data.overview.totalToPay,
            response.data.overview.totalPaid,
            response.data.overview.totalNotPaid
          ]
        )
      ) {
        this.countAll = response.data.overview.countAll;
        this.countPaid = response.data.overview.countPaid;
        this.countPartiallyPaid = response.data.overview.countPartiallyPaid;
        this.countNotPaid = response.data.overview.countNotPaid;
        this.totalToPay = response.data.overview.totalToPay;
        this.totalPaid = response.data.overview.totalPaid;
        this.totalNotPaid = response.data.overview.totalNotPaid;
      }

      if (!_.isEqual(this.items, response.data.rents)) {
        this.items = response.data.rents;
        if (this.selected?._id) {
          this.setSelected(
            this.items.find((item) => item._id === this.selected._id) || {}
          );
        }
      }
      return response;
    } catch (error) {
      return error;
    }
  }

  *fetchOneTenantRent(tenantId, term) {
    try {
      const response = yield apiClient.get(`/rents/tenant/${tenantId}/${term}`);

      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }

  *fetchTenantRents(tenantId) {
    try {
      const response = yield apiClient.get(`/rents/tenant/${tenantId}`);
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return { status: error?.response?.status ?? 500 };
    }
  }

  *pay(term, payment) {
    try {
      const response = yield apiClient.patch(
        `/rents/payment/${payment._id}/${term}`,
        payment
      );
      const rent = response.data;
      const index = this.items.findIndex((item) => item._id === payment._id);
      if (index > -1) {
        this.items.splice(index, 1, rent);
      }
      if (this.selected?._id === payment._id) {
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
      yield apiClient.post('/emails', payload);
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }
}
