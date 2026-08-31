import { action, computed, flow, makeObservable, observable } from 'mobx';

import apiClient from '../utils/apiClient';

export default class Organization {
  constructor(store) {
    this.store = store;
    this.selected = undefined;

    makeObservable(this, {
      selected: observable,
      setSelected: action,
      canSendEmails: computed,
      fetch: flow,
      create: flow,
      update: flow
    });
  }

  setSelected = (org) => {
    this.selected = org;
  };

  get canSendEmails() {
    return !!this.selected?.thirdParties?.smtp?.server;
  }

  *fetch() {
    try {
      const response = yield apiClient.get('/realms');
      this.setSelected(response.data ?? undefined);
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return { status: error?.response?.status ?? 500 };
    }
  }

  *create(organization) {
    try {
      const response = yield apiClient.post('/realms', organization);
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return {
        status: error?.response?.status ?? 500,
        message: error?.response?.data?.message
      };
    }
  }

  *update(organization) {
    try {
      const response = yield apiClient.patch(
        `/realms/${organization._id}`,
        organization
      );
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return {
        status: error?.response?.status ?? 500,
        message: error?.response?.data?.message
      };
    }
  }
}
