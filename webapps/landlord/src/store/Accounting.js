import { action, computed, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Accounting {
  constructor() {
    this.data = {};
    this.searchText = '';

    makeObservable(this, {
      data: observable,
      searchText: observable,
      fetch: flow,
      filteredData: computed,
      setSearch: action
    });
  }

  setSearch(searchText) {
    this.searchText = searchText;
  }

  get filteredData() {
    if (!this.searchText) {
      return this.data;
    }

    const incoming = this.data.incomingTenants?.filter((tenant) => {
      return tenant.name.toLowerCase().includes(this.searchText.toLowerCase());
    });

    const outgoing = this.data.outgoingTenants?.filter((tenant) => {
      return tenant.name.toLowerCase().includes(this.searchText.toLowerCase());
    });

    const settlements = this.data.settlements?.filter((settlement) => {
      return settlement.tenant
        .toLowerCase()
        .includes(this.searchText.toLowerCase());
    });

    return {
      ...this.data,
      incomingTenants: incoming || [],
      outgoingTenants: outgoing || [],
      settlements: settlements || []
    };
  }

  *fetch(year) {
    try {
      const response = yield apiFetcher().get(`/accounting/${year}`);
      this.data = response.data;

      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
