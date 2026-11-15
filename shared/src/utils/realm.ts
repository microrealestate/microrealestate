import type { CompanyInfo } from '../common';
import type { RealmType } from '../entities/realm';

export function landlordName(
  realm: Pick<RealmType, 'name' | 'isCompany'> & {
    companyInfo?: Pick<CompanyInfo, 'name'> | null;
  }
): string {
  return (realm.isCompany && realm.companyInfo?.name) || realm.name || '';
}
