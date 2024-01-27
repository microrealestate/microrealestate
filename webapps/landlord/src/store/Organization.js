import { action, computed, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Organization {
  constructor() {
    this.selected = undefined;
    this.items = [];

    makeObservable(this, {
      selected: observable,
      items: observable,
      setSelected: action,
      setItems: action,
      canSendEmails: computed,
      canUploadDocumentsInCloud: computed,
      fetch: flow,
      create: flow,
      createAppCredentials: flow,
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

  get canSendEmails() {
    return (
      !!this.selected?.thirdParties?.gmail?.selected ||
      this.selected?.thirdParties?.smtp?.selected ||
      this.selected?.thirdParties?.mailgun?.selected
    );
  }

  get canUploadDocumentsInCloud() {
    return !!this.selected?.thirdParties?.b2;
  }

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

  *createAppCredentials(app) {
    try {
      const response = yield apiFetcher().post(
        '/authenticator/landlord/appcredz',
        {
          expiry: app.expiryDate,
          organizationId: this.selected?._id,
        }
      );
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
