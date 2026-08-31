import * as LandlordModule from './api/landlord';
import * as TenantModule from './api/tenant';

export namespace API {
  export import Landlord = LandlordModule;
  export import Tenant = TenantModule;
}

export * from './common/index';
export * from './entities/account';
export * from './entities/document';
export * from './entities/email';
export * from './entities/lease';
export * from './entities/property';
export * from './entities/realm';
export * from './entities/template';
export * from './entities/tenant';
export * from './entities/todo';
export * from './utils';
