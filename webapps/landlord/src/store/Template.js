import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Template {
  selected = {};
  items = [];
  fields = [];

  constructor() {
    makeObservable(this, {
      selected: observable,
      setSelected: action,
      items: observable,
      fetch: flow,
      fetchOne: flow,
      create: flow,
      update: flow,
      delete: flow,
      fields: observable,
      fetchFields: flow,
    });
  }

  setSelected = (lease) => (this.selected = lease);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/templates');
      this.items = response.data;
      if (this.selected) {
        this.selected = this.items.find(({ _id }) => this.selected._id === _id);
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchOne(templateId) {
    try {
      const response = yield apiFetcher().get(`/templates/${templateId}`);
      const updatedTemplate = response.data;
      const index = this.items.findIndex((item) => item._id === templateId);
      if (index > -1) {
        this.items.splice(index, 1, updatedTemplate);
      }
      if (this.selected?._id === updatedTemplate._id) {
        this.selected = updatedTemplate;
      }
      return { status: 200, data: updatedTemplate };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(template) {
    try {
      const response = yield apiFetcher().post('/templates', template);
      const createdTemplate = response.data;
      this.items.push(createdTemplate);

      return { status: 200, data: createdTemplate };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(template) {
    try {
      const response = yield apiFetcher().patch('/templates', template);
      const updatedTemplate = response.data;
      const index = this.items.findIndex((item) => item._id === template._id);
      if (index > -1) {
        this.items.splice(index, 1, updatedTemplate);
      }
      if (this.selected?._id === updatedTemplate._id) {
        this.selected = updatedTemplate;
      }
      return { status: 200, data: updatedTemplate };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/templates/${ids.join(',')}`);
      this.items = this.items.filter((template) => !ids.includes(template._id));
      if (ids.includes(this.selected?._id)) {
        this.selected = null;
      }
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchFields() {
    try {
      const response = yield apiFetcher().get('/templates/fields');
      this.fields = response.data;
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
