import { action, computed, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import { updateItems } from './utils';

export default class Warranty {
  constructor() {
    this.selected = {};
    this.filters = { searchText: '' };
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
      delete: flow,
    });
  }

  get filteredItems() {
    let filteredItems = this.items;

    if (this.filters.searchText) {
      const regExp = /\s|\.|-/gi;
      const cleanedSearchText = this.filters.searchText
        .toLowerCase()
        .replace(regExp, '');

      filteredItems = filteredItems.filter(
        ({ name }) =>
          name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
          -1
      );
    }
    return filteredItems;
  }

  setSelected = (warranty) => (this.selected = warranty);

  setFilters = ({ searchText = '' }) =>
    (this.filters = { searchText });

  *fetch(propertyId) {
    try {
      console.log("Calling Warranties API")
      const response = yield apiFetcher().get(`/warranties/${propertyId}`);

      this.items = response.data;
      if (this.selected?._id) {
        this.setSelected(
          this.items.find((item) => item._id === this.selected._id) || {}
        );
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchOne(propertyId, warrantyId) {
    try {
      const response = yield apiFetcher().get(`/warranties/${propertyId}/${warrantyId}`);
      const updatedWarranty = response.data;
      this.items = updateItems(updatedWarranty, this.items);
      if (this.selected?._id === updatedWarranty._id) {
        this.selected = updatedWarranty;
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(warranty) {
    try {
      const response = yield apiFetcher().post('/warranties', warranty);
      const createdWarranty = response.data;
      this.items = updateItems(createdWarranty, this.items);

      return { status: 200, data: createdWarranty };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(warranty) {
    try {
      const response = yield apiFetcher().patch(
        `/warranties/${warranty._id}`,
        warranty
      );
      const updatedWarranty = response.data;
      this.items = updateItems(updatedWarranty, this.items);
      if (this.selected?._id === updatedWarranty._id) {
        this.setSelected(updatedWarranty);
      }
      return { status: 200, data: updatedWarranty };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/warranties/${ids.join(',')}`);
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
