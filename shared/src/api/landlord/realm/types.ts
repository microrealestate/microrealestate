import type { BankInfo, CompanyInfo } from '../../../common';

import type { RealmType } from '../../../entities/realm';

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
};
