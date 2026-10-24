import { ServiceError } from '@microrealestate/common';
import type { Member, RealmType } from '@microrealestate/shared';

export type LandlordData = ReturnType<typeof toLandlordData>;

// The realm, plus the flags and names the templates need precomputed
export function toLandlordData(realm: RealmType) {
  const name =
    (realm.isCompany ? realm.companyInfo?.name : realm.contacts?.[0]?.name) ||
    '';
  const hasCompanyInfo = !!realm.companyInfo;
  return {
    ...realm,
    name,
    hasCompanyInfo,
    legalName: hasCompanyInfo
      ? `${realm.companyInfo?.legalStructure} ${name}`
      : name,
    hasBankInfo: !!realm.bankInfo?.iban,
    hasAddress: !!realm.addresses?.length,
    hasContact: !!realm.contacts?.length,
    members: [realm.member1, realm.member2].filter(
      (member): member is Member => !!member?.email
    )
  };
}

// An absolute link into the app, on the domain configured for the organization
export function appUrl(realm: RealmType, pathname: string): string {
  if (!realm.webServer?.domain) {
    throw new ServiceError('missing domain', 422);
  }
  const scheme = realm.webServer.httpsEnabled ? 'https' : 'http';
  return `${scheme}://${realm.webServer.domain}${pathname}`;
}
