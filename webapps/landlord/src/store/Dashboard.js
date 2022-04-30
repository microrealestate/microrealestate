import { computed, flow, makeObservable, observable, toJS } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import moment from 'moment';

export default class Dashboard {
  data = {};

  constructor() {
    makeObservable(this, {
      data: observable,
      fetch: flow,
      currentRevenues: computed,
    });
  }

  get currentRevenues() {
    const currentMonth = moment().format('MMYYYY');
    const revenues = toJS(
      this.data.revenues.find(({ month }) => currentMonth === month)
    ) || {
      month: currentMonth,
      paid: 0,
      notPaid: 0,
    };

    revenues.notPaid = Math.abs(revenues.notPaid);
    return revenues;
  }

  *fetch() {
    try {
      const response = yield apiFetcher().get('/dashboard');
      this.data = response.data;

      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
