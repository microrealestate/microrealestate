// TODO: remove momentjs and use date-fns
// TODO: import only the locale needed
import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';
import { type ClassValue, clsx } from 'clsx';
import { LeaseTimeRange, Locale, TenantAPI } from '@microrealestate/types';
import { Lease } from '@/types';
import moment from 'moment';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMoment(locale: Locale) {
  const lang = locale.split('-')[0];
  return (date: Date | string, pattern?: string) => {
    if (pattern) {
      return moment(date, pattern).locale(lang);
    }
    return moment(date).locale(lang);
  };
}

export function getFormatTimeRange(locale: Locale, timeRange: LeaseTimeRange) {
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

export function toUILease(tenant: TenantAPI.TenantDataType): Lease {
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
    invoices: tenant.lease.invoices.map((invoice) => ({
      id: String(invoice.term),
      term: invoice.term,
      grandTotal: invoice.grandTotal,
      payment: invoice.payment,
      status: invoice.status,
      methods: invoice.methods
    })),
    documents: [],
    //documents: tenant.lease.documents.map((document) => ({}))
  };
}
