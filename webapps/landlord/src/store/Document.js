import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Document {
  selected = {};
  items = [];

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
    });
  }

  setSelected = (document) => (this.selected = document);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/documents');
      this.items = response.data;
      if (this.selected) {
        this.selected = this.items.find(({ _id }) => this.selected._id === _id);
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchOne(documentId) {
    try {
      const response = yield apiFetcher().get(`/documents/${documentId}`);
      const updatedDocument = response.data;
      const index = this.items.findIndex((item) => item._id === documentId);
      if (index > -1) {
        this.items.splice(index, 1, updatedDocument);
      }
      if (this.selected?._id === updatedDocument._id) {
        this.selected = updatedDocument;
      }
      return { status: 200, data: updatedDocument };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(document) {
    try {
      const response = yield apiFetcher().post('/documents', document);
      const createdDocument = response.data;
      this.items.push(createdDocument);

      return { status: 200, data: createdDocument };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(document) {
    try {
      const response = yield apiFetcher().patch('/documents', document);
      const updatedDocument = response.data;
      const index = this.items.findIndex((item) => item._id === document._id);
      if (index > -1) {
        this.items.splice(index, 1, updatedDocument);
      }
      if (this.selected?._id === updatedDocument._id) {
        this.selected = updatedDocument;
      }
      return { status: 200, data: updatedDocument };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/documents/${ids.join(',')}`);
      this.items = this.items.filter((document) => !ids.includes(document._id));
      if (ids.includes(this.selected?._id)) {
        this.selected = null;
      }
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
