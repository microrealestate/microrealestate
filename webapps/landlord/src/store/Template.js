import { action, flow, makeObservable, observable } from 'mobx';

import apiClient from '../utils/apiClient';
import { updateItems } from './utils';

export default class Template {
  constructor() {
    this.selected = {};
    this.items = [];
    this.fields = [];

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
      fetchFields: flow
    });
  }

  setSelected = (lease) => {
    this.selected = lease;
  };

  *fetch() {
    try {
      const response = yield apiClient.get('/templates');
      this.items = response.data;
      if (this.selected?._id) {
        this.selected =
          this.items.find(({ _id }) => this.selected._id === _id) || {};
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *fetchOne(templateId) {
    try {
      const response = yield apiClient.get(`/templates/${templateId}`);
      const updatedTemplate = response.data;
      this.items = updateItems(updatedTemplate, this.items);
      if (this.selected?._id === updatedTemplate._id) {
        this.selected = updatedTemplate;
      }
      return { status: 200, data: updatedTemplate };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *create(template) {
    try {
      const response = yield apiClient.post('/templates', template);
      const createdTemplate = response.data;
      this.items = updateItems(createdTemplate, this.items);

      return { status: 200, data: createdTemplate };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *update(template) {
    try {
      const response = yield apiClient.patch('/templates', template);
      const updatedTemplate = response.data;
      this.items = updateItems(updatedTemplate, this.items);
      if (this.selected?._id === updatedTemplate._id) {
        this.selected = updatedTemplate;
      }
      return { status: 200, data: updatedTemplate };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }

  *delete(ids) {
    try {
      yield apiClient.delete(`/templates/${ids.join(',')}`);
      this.items = this.items.filter((template) => !ids.includes(template._id));
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

  *fetchFields() {
    try {
      const response = yield apiClient.get('/templates/fields');
      this.fields = response.data;
      return { status: 200 };
    } catch (error) {
      return {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      };
    }
  }
}
