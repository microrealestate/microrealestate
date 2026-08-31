import type { Address } from '../../common';
import type { LeaseStatus, LeaseTimeRange } from '../../entities/lease';
import type { Locale } from '../../entities/realm';
import type { PaymentMethod, PaymentStatus } from '../../entities/tenant';

export type TenantDataType = {
  tenant: {
    id: string;
    name: string;
    isCompany?: boolean;
    company?: string;
    manager?: string;
    legalForm?: string;
    siret?: string;
    rcs?: string;
    capital?: number;
    contacts: {
      name: string;
      email: string;
      phone1: string;
      phone2?: string;
    }[];
    addresses: Address[];
  };
  landlord: {
    id: string;
    name: string;
    currency: string;
    locale: Locale;
    addresses: Address[];
    contacts: {
      name: string;
      email: string;
      phone1: string;
      phone2?: string;
    }[];
  };
  lease: {
    name: string;
    beginDate?: string;
    endDate?: string;
    terminationDate?: string;
    timeRange?: LeaseTimeRange;
    status: LeaseStatus;
    rent: {
      totalPreTaxAmount: number;
      totalChargesAmount: number;
      totalVatAmount: number;
      totalAmount: number;
    };
    remainingIterations: number;
    remainingIterationsToPay: number;
    properties: {
      id: string;
      name: string;
      description?: string;
      type?: string;
    }[];
    receipts: {
      id: string;
      term: number;
      balance: number;
      grandTotal: number;
      payment: number;
      payments: {
        date: string;
        method: string;
        reference: string;
        amount: number;
      }[];
      status: PaymentStatus;
      methods: PaymentMethod[];
    }[];
    balance: number;
    deposit: number;
  };
};
