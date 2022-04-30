import { flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Accounting {
  data = {};

  constructor() {
    makeObservable(this, {
      data: observable,
      fetch: flow,
    });
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
