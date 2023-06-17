import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import { updateItems } from './utils';

export default class Lease {
  constructor() {
    this.selected = {};
    this.items = [];

    makeObservable(this, {
      selected: observable,
      setSelected: action,
      items: observable,
      fetch: flow,
      fetchOne: flow,
      create: flow,
      update: flow,
      delete: flow,
    });
  }

  setSelected = (lease) => (this.selected = lease);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/leases');

      this.items = response.data;
      if (this.selected) {
        this.selected = this.items.find(({ _id }) => this.selected._id === _id);
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchOne(leaseId) {
    try {
      const response = yield apiFetcher().get(`/leases/${leaseId}`);
      const updatedLease = response.data;
      this.items = updateItems(updatedLease, this.items);
      if (this.selected?._id === updatedLease._id) {
        this.selected = updatedLease;
      }
      return { status: 200, data: updatedLease };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(lease) {
    try {
      const response = yield apiFetcher().post('/leases', lease);
      const createdLease = response.data;
      this.items = updateItems(createdLease, this.items);

      return { status: 200, data: createdLease };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(lease) {
    try {
      const response = yield apiFetcher().patch(`/leases/${lease._id}`, lease);
      const updatedLease = response.data;
      this.items = updateItems(updatedLease, this.items);
      if (this.selected?._id === updatedLease._id) {
        this.selected = updatedLease;
      }
      return { status: 200, data: updatedLease };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/leases/${ids.join(',')}`);
      this.items = this.items.filter((lease) => !ids.includes(lease._id));
      if (ids.includes(this.selected?._id)) {
        this.selected = null;
      }
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
