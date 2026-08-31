import { action, flow, makeObservable, observable } from 'mobx';

import apiClient from '../utils/apiClient';
import { updateItems } from './utils';

export default class Document {
  constructor() {
    this.selected = {};
    this.items = [];

    makeObservable(this, {
      selected: observable,
      setSelected: action,
      items: observable,
      fetchTenant: flow,
      fetchOne: flow,
      create: flow,
      update: flow,
      delete: flow
    });
  }

  setSelected = (document) => {
    this.selected = document;
  };

  *fetchTenant(tenantId) {
    try {
      const response = yield apiClient.get(`/documents/tenant/${tenantId}`);
      this.items = response.data;
      if (this.selected?._id) {
        this.selected =
          this.items.find(({ _id }) => this.selected._id === _id) || {};
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }

  *fetchOne(documentId) {
    try {
      const response = yield apiClient.get(`/documents/${documentId}`);
      const updatedDocument = response.data;
      this.items = updateItems(updatedDocument, this.items);
      if (this.selected?._id === updatedDocument._id) {
        this.selected = updatedDocument;
      }
      return { status: 200, data: updatedDocument };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }

  *create(document) {
    try {
      const response = yield apiClient.post('/documents', document);
      const createdDocument = response.data;
      this.items = updateItems(createdDocument, this.items);

      return { status: 200, data: createdDocument };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }

  *update(document) {
    try {
      const response = yield apiClient.patch('/documents', document);
      const updatedDocument = response.data;
      this.items = updateItems(updatedDocument, this.items);
      if (this.selected?._id === updatedDocument._id) {
        this.selected = updatedDocument;
      }
      return { status: 200, data: updatedDocument };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }

  *delete(ids) {
    try {
      yield apiClient.patch('/documents/trash', { ids });
      this.items = this.items.filter((document) => !ids.includes(document._id));
      if (ids.includes(this.selected?._id)) {
        this.selected = {};
      }
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status ?? 500 };
    }
  }
}
