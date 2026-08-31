import type { Contact } from '../common';
import type { PropertyType } from './property';

export const PAYMENT_METHODS = [
  'transfer',
  'card',
  'cash',
  'cheque',
  'direct_debit',
  'other'
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentStatus = 'paid' | 'partially-paid' | 'unpaid';

export type OccupantStatus = 'inprogress' | 'stopped';

export type RentLineItem = {
  amount: number;
  description?: string;
};

/** Sortable date string YYYY-MM-DDTHH:mm. */
export type Payment = {
  date: string;
  type: PaymentMethod;
  reference: string;
  amount: number;
};

export type SecurityDepositEntry = {
  amount: number;
  date: string;
  paymentType: PaymentMethod;
  reference?: string;
};

export type Rent = {
  term: number;
  preTaxAmounts: RentLineItem[];
  charges: RentLineItem[];
  debts: RentLineItem[];
  discounts: { origin: string; amount: number; description?: string }[];
  vats: {
    origin: string;
    amount: number;
    description?: string;
    rate: number;
  }[];
  payments: Payment[];
  total: {
    preTaxAmount: number;
    charges: number;
    vat: number;
    discount: number;
    debts: number;
    balance: number;
    grandTotal: number;
    payment: number;
  };
  description?: string;
};

export interface TenantType<Realm = string, Lease = string, Property = string> {
  _id: string;
  realmId: Realm;
  name: string;
  isCompany?: boolean;
  company?: string;
  manager?: string;
  legalForm?: string;
  siret?: string;
  rcs?: string;
  capital?: number;
  street1?: string;
  street2?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
  contacts: Contact[];
  reference: string;
  contract?: string;
  leaseId?: Lease;
  beginDate?: string;
  endDate?: string;
  terminationDate?: string;
  lastRenewedAt?: string;
  renewalCount: number;
  properties: {
    propertyId: Property;
    property: Omit<PropertyType, '_id' | 'realmId'>;
    rent: number;
    expenses: {
      title: string;
      amount: number;
      beginDate: string;
      endDate?: string;
    }[];
    entryDate: string;
    exitDate?: string;
  }[];
  rents: Rent[];
  isVat?: boolean;
  vatRatio?: number;
  discount?: number;
  expectedSecurityDeposit?: number;
  securityDeposit: SecurityDepositEntry[];
  securityDepositRefund: SecurityDepositEntry[];
  stepperMode?: boolean;
}
