import { action, computed, flow, makeObservable, observable } from 'mobx';

import apiClient from '../utils/apiClient';
import { updateItems } from './utils';

export default class Tenant {
  constructor() {
    this.selected = {};
    this.filters = { searchText: '', status: ['inprogress'] };
    this.items = [];

    makeObservable(this, {
      selected: observable,
      filters: observable,
      items: observable,
      filteredItems: computed,
      setSelected: action,
      setFilters: action,
      fetch: flow,
      fetchOne: flow,
      create: flow,
      update: flow,
      delete: flow
    });
  }

  get filteredItems() {
    let filteredItems =
      this.filters.status?.length === 0
        ? this.items
        : this.items.filter(({ status }) =>
            this.filters.status.includes(status)
          );

    if (this.filters.searchText) {
      const regExp = /\s|\.|-/gi;
      const cleanedSearchText = this.filters.searchText
        .toLowerCase()
        .replace(regExp, '');

      filteredItems = filteredItems.filter(
        ({ isCompany, name, manager, contacts, properties }) => {
          // Search match name
          let found =
            name
              .replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) !== -1;

          // Search match manager
          if (!found && isCompany) {
            found =
              manager
                ?.replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) !== -1;
          }

          // Search match contact
          if (!found) {
            found = !!contacts
              ?.map(({ contact = '', email = '', phone = '' }) => ({
                contact: contact.replace(regExp, '').toLowerCase(),
                email: email.toLowerCase(),
                phone: phone.replace(regExp, '')
              }))
              .filter(
                ({ contact, email, phone }) =>
                  contact.indexOf(cleanedSearchText) !== -1 ||
                  email.indexOf(cleanedSearchText) !== -1 ||
                  phone.indexOf(cleanedSearchText) !== -1
              ).length;
          }

          // Search match property name
          if (!found) {
            found = !!properties?.filter(
              ({ property: { name } }) =>
                name
                  .replace(regExp, '')
                  .toLowerCase()
                  .indexOf(cleanedSearchText) !== -1
            ).length;
          }
          return found;
        }
      );
    }
    return filteredItems;
  }

  setSelected = (tenant) => {
    this.selected = tenant;
  };

  setFilters = ({ searchText = '', status = [] }) => {
    this.filters = { searchText, status };
  };

  *fetch() {
    try {
      const response = yield apiClient.get('/tenants');

      this.items = response.data;
      if (this.selected._id) {
        this.setSelected(
          this.items.find((item) => item._id === this.selected._id) || {}
        );
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *fetchOne(tenantId) {
    try {
      const response = yield apiClient.get(`/tenants/${tenantId}`);
      const updatedTenant = response.data;
      this.items = updateItems(updatedTenant, this.items);
      if (this.selected?._id === updatedTenant._id) {
        this.setSelected(updatedTenant);
      }
      return { status: 200, data: updatedTenant };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *create(tenant) {
    try {
      const response = yield apiClient.post('/tenants', tenant);
      const createdTenant = response.data;
      this.items = updateItems(createdTenant, this.items);

      return { status: 200, data: createdTenant };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *update(tenant) {
    try {
      const response = yield apiClient.patch(`/tenants/${tenant._id}`, tenant);
      const updatedTenant = response.data;
      this.items = updateItems(updatedTenant, this.items);
      if (this.selected?._id === updatedTenant._id) {
        this.setSelected(updatedTenant);
      }
      return { status: 200, data: updatedTenant };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *delete(ids) {
    try {
      yield apiClient.delete(`/tenants/${ids.join(',')}`);
      this.items = this.items.filter((tenant) => !ids.includes(tenant._id));
      if (ids.includes(this.selected?._id)) {
        this.selected = {};
      }
      return { status: 200 };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }
}
