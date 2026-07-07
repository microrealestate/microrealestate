import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import { updateItems } from './utils';

export default class LeaseInstance {
  constructor() {
    this.selected = null;
    this.items = [];

    makeObservable(this, {
      selected: observable,
      setSelected: action,
      items: observable,
      fetchByTenant: flow,
      fetchByProperty: flow,
      fetchOne: flow,
      create: flow,
      update: flow,
      activate: flow,
      delete: flow
    });
  }

  setSelected = (leaseInstance) => (this.selected = leaseInstance);

  *fetchByTenant(tenantId) {
    if (!tenantId) {
      this.items = [];
      return { status: 200, data: [] };
    }

    try {
      const response = yield apiFetcher().get(`/lease-instances/by-tenant/${tenantId}`);
      this.items = response.data || [];
      if (this.selected?._id) {
        this.selected = this.items.find(({ _id }) => _id === this.selected._id) || null;
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchByProperty(propertyId) {
    if (!propertyId) {
      this.items = [];
      return { status: 200, data: [] };
    }

    try {
      const response = yield apiFetcher().get(`/lease-instances/by-property/${propertyId}`);
      this.items = response.data || [];
      if (this.selected?._id) {
        this.selected = this.items.find(({ _id }) => _id === this.selected._id) || null;
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchOne(leaseInstanceId) {
    try {
      const response = yield apiFetcher().get(`/lease-instances/${leaseInstanceId}`);
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

  *create(leaseInstance) {
    try {
      const response = yield apiFetcher().post('/lease-instances', leaseInstance);
      const createdLease = response.data;
      this.items = updateItems(createdLease, this.items);
      return { status: 201, data: createdLease };
    } catch (error) {
      return { status: error?.response?.status, data: error?.response?.data };
    }
  }

  *update(leaseInstance) {
    try {
      const response = yield apiFetcher().patch(
        `/lease-instances/${leaseInstance._id}`,
        leaseInstance
      );
      const updatedLease = response.data;
      this.items = updateItems(updatedLease, this.items);
      if (this.selected?._id === updatedLease._id) {
        this.selected = updatedLease;
      }
      return { status: 200, data: updatedLease };
    } catch (error) {
      return { status: error?.response?.status, data: error?.response?.data };
    }
  }

  *activate(leaseInstanceId, payload = {}) {
    try {
      const response = yield apiFetcher().post(
        `/lease-instances/${leaseInstanceId}/activate`,
        payload
      );
      const updatedLease = response.data;
      this.items = updateItems(updatedLease, this.items);
      if (this.selected?._id === updatedLease._id) {
        this.selected = updatedLease;
      }
      return { status: 200, data: updatedLease };
    } catch (error) {
      return { status: error?.response?.status, data: error?.response?.data };
    }
  }

  *delete(leaseInstanceId) {
    try {
      yield apiFetcher().delete(`/lease-instances/${leaseInstanceId}`);
      this.items = this.items.filter(({ _id }) => _id !== leaseInstanceId);
      if (this.selected?._id === leaseInstanceId) {
        this.selected = null;
      }
      return { status: 204 };
    } catch (error) {
      return { status: error?.response?.status, data: error?.response?.data };
    }
  }
}
