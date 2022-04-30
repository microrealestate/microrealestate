import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Organization {
  selected;
  items = [];

  constructor() {
    makeObservable(this, {
      selected: observable,
      items: observable,
      setSelected: action,
      setItems: action,
      fetch: flow,
      create: flow,
      update: flow,
    });
  }

  setSelected = (org, user) => {
    this.selected = org;
    user.setRole(
      this.selected.members.find(({ email }) => email === user.email).role
    );
  };

  setItems = (organizations = []) => {
    this.items = organizations;
  };

  *fetch() {
    try {
      const response = yield apiFetcher().get('/realms');
      this.setItems(response.data);
      return 200;
    } catch (error) {
      console.error(error);
      return error.response.status;
    }
  }

  *create(organization) {
    try {
      const response = yield apiFetcher().post('/realms', organization);
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return { status: error?.response?.status };
    }
  }

  *update(organization) {
    try {
      const response = yield apiFetcher().patch(
        `/realms/${organization._id}`,
        organization
      );
      return { status: 200, data: response.data };
    } catch (error) {
      console.error(error);
      return { status: error?.response?.status };
    }
  }
}
