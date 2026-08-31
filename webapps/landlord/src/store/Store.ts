import { action, makeObservable, observable } from 'mobx';
import { setAccessToken } from '../utils/apiClient';
import Accounting from './Accounting';
import Document from './Document';
import Lease from './Lease';
import Organization from './Organization';
import Property from './Property';
import Rent from './Rent';
import Template from './Template';
import Tenant from './Tenant';
import User from './User';

export default class Store {
  user!: User;
  organization!: Organization;
  lease!: Lease;
  rent!: Rent;
  tenant!: Tenant;
  property!: Property;
  template!: Template;
  document!: Document;
  accounting!: Accounting;

  constructor() {
    this.reset();

    makeObservable(this, {
      user: observable,
      organization: observable,
      lease: observable,
      rent: observable,
      tenant: observable,
      property: observable,
      template: observable,
      document: observable,
      accounting: observable,
      reset: action
    });
  }

  reset() {
    this.user = new User(this);
    this.organization = new Organization(this);
    this.lease = new Lease();
    this.rent = new Rent();
    this.tenant = new Tenant();
    this.property = new Property();
    this.template = new Template();
    this.document = new Document();
    this.accounting = new Accounting();

    setAccessToken(null);
  }
}
