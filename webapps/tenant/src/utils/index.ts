// TODO: remove momentjs and use date-fns
// TODO: import only the locale needed
import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';
import 'moment/locale/es';
import type { API, LeaseTimeRange } from '@microrealestate/shared';
import moment from 'moment';
import type { Lease } from '@/types';

export function getMoment(locale: string) {
  const lang = locale.split('-')[0] ?? 'en';
  return (date: Date | string, pattern?: string) => {
    if (pattern) {
      return moment(date, pattern).locale(lang);
    }
    return moment(date).locale(lang);
  };
}

export function getFormatTimeRange(locale: string, timeRange?: LeaseTimeRange) {
  const m = getMoment(locale);
  return (term: number) => {
    const momentTerm = m(String(term), 'YYYYMMDDHH');
    switch (timeRange) {
      case 'days':
        return momentTerm.format('LL');
      case 'weeks':
        return momentTerm.format('Wo');
      case 'months':
        return momentTerm.format('MMMM YYYY');
      case 'years':
        return momentTerm.format('YYYY');
      default:
        return String(term);
    }
  };
}

export function toUILease(tenant: API.Tenant.TenantDataType): Lease {
  return {
    landlord: tenant.landlord,
    tenant: tenant.tenant,
    name: tenant.lease.name,
    beginDate: tenant.lease.beginDate
      ? new Date(tenant.lease.beginDate)
      : undefined,
    endDate: tenant.lease.endDate ? new Date(tenant.lease.endDate) : undefined,
    terminationDate: tenant.lease.terminationDate
      ? new Date(tenant.lease.terminationDate)
      : undefined,
    timeRange: tenant.lease.timeRange,
    status: tenant.lease.status,
    rent: tenant.lease.rent,
    remainingIterations: tenant.lease.remainingIterations,
    remainingIterationsToPay: tenant.lease.remainingIterationsToPay,
    properties: tenant.lease.properties.map((property) => ({
      id: property.id,
      name: property.name,
      description: property.description,
      type: property.type
    })),
    balance: tenant.lease.balance,
    deposit: tenant.lease.deposit,
    receipts: tenant.lease.receipts.map((receipt) => ({
      id: String(receipt.term),
      term: receipt.term,
      grandTotal: receipt.grandTotal,
      payment: receipt.payment,
      status: receipt.status,
      methods: receipt.methods
    }))
  };
}
