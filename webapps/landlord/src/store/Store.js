import { makeObservable, observable } from 'mobx';
import { setAccessToken, setOrganizationId } from '../utils/fetch';

import Accounting from './Accounting';
import Dashboard from './Dashboard';
import Document from './Document';
import Lease from './Lease';
import moment from 'moment';
import Organization from './Organization';
import Property from './Property';
import Rent from './Rent';
import Template from './Template';
import Tenant from './Tenant';
import User from './User';

export default class Store {
  constructor() {
    this.toastMessages = [];
    this.user = new User();
    this.organization = new Organization();
    this.lease = new Lease();
    this.rent = new Rent();
    this.tenant = new Tenant();
    this.property = new Property();
    this.template = new Template();
    this.document = new Document();
    this.dashboard = new Dashboard();
    this.accounting = new Accounting();

    makeObservable(this, {
      user: observable,
      organization: observable,
      lease: observable,
      rent: observable,
      tenant: observable,
      property: observable,
      template: observable,
      document: observable,
      dashboard: observable,
      accounting: observable
    });
  }

  hydrate(initialData) {
    if (!initialData) {
      return;
    }

    const {
      user = {},
      organization = {
        items: []
      },
      lease = {
        items: []
      },
      rent = {
        items: []
      },
      tenant = {
        items: []
      },
      property = {
        items: []
      },
      template = {
        items: [],
        fields: []
      },
      document = {
        items: []
      },
      dashboard = {
        data: {}
      },
      accounting = {
        data: {}
      }
    } = initialData;

    this.user.firstName = user.firstName;
    this.user.lastName = user.lastName;
    this.user.email = user.email;
    this.user.role = user.role;
    this.user.token = user.token;
    this.user.tokenExpiry = user.tokenExpiry;
    setAccessToken(user.token);

    this.organization.items = organization.items;
    this.organization.selected = organization.selected;
    setOrganizationId(organization.selected?._id);

    this.lease.items = lease.items;
    this.lease.selected = lease.selected;

    this.rent.items = rent.items;
    this.rent.selected = rent.selected;
    this.rent.filters = rent.filters;
    if (rent._period) {
      this.rent.setPeriod(moment(rent._period));
    }
    this.rent.countAll = rent.countAll;
    this.rent.countPaid = rent.countPaid;
    this.rent.countPartiallyPaid = rent.countPartiallyPaid;
    this.rent.countNotPaid = rent.countNotPaid;
    this.rent.totalToPay = rent.totalToPay;
    this.rent.totalPaid = rent.totalPaid;
    this.rent.totalNotPaid = rent.totalNotPaid;

    this.tenant.items = tenant.items;
    this.tenant.selected = tenant.selected;
    this.tenant.filters = tenant.filters;

    this.property.items = property.items;
    this.property.selected = property.selected;
    this.property.filters = property.filters;

    this.template.items = template.items;
    this.template.selected = template.selected;
    this.template.fields = template.fields;

    this.document.items = document.items;
    this.document.selected = document.selected;

    this.dashboard.data = dashboard.data;

    this.accounting.data = accounting.data;
  }
}
