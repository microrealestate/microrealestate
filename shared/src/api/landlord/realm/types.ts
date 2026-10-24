import type { BankInfo, CompanyInfo } from '../../../common';

import type { RealmType, ReverseProxy } from '../../../entities/realm';

export type RealmThirdParties = NonNullable<RealmType['thirdParties']>;

// Extends RealmThirdParties with update-flag fields sent by the client in PATCH requests
export type RealmThirdPartiesRequestBody = {
  smtp?: RealmThirdParties['smtp'] & { passwordUpdated?: boolean };
};

export type RealmData = Omit<
  RealmType,
  'thirdParties' | 'bankInfo' | 'companyInfo'
> & {
  bankInfo?: BankInfo;
  companyInfo?: CompanyInfo;
  thirdParties?: RealmThirdParties;
  /**
   * Read-only, computed by the API from its environment: who serves the app.
   * Never persisted and ignored when sent back in an update body.
   */
  reverseProxy?: ReverseProxy;
};
