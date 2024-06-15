import {
  LeaseStatus,
  LeaseTimeRange,
  PaymentMethod,
  PaymentStatus
} from '../../common/index.js';
import { CollectionTypes } from '../../common/collections.js';
import { Locale } from '../../common/locales.js';

export type TenantDataType = {
  tenant: {
    id: string;
    name: string;
    contacts: {
      name: string;
      email: string;
      phone1: string;
    }[];
    addresses: CollectionTypes.PartAddress[];
  };
  landlord: {
    name: string;
    currency: string;
    locale: Locale;
    addresses: CollectionTypes.PartAddress[];
    contacts: {
      name: string;
      email: string;
      phone1: string;
      phone2: string;
    }[];
  };
  lease: {
    name: string;
    beginDate: Date;
    endDate: Date;
    terminationDate?: Date;
    timeRange: LeaseTimeRange;
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
      description: string;
      type: string;
    }[];
    documents:
      | {
          name: string;
          description: string;
          url: string;
        }[]
      | [];
    invoices:
      | {
          id: string;
          term: number;
          balance: number;
          grandTotal: number;
          payment: number;
          payments:
            | {
                date: string;
                method: string;
                reference: string;
                amount: number;
              }[]
            | [];
          status: PaymentStatus;
          methods: PaymentMethod[] | [];
        }[]
      | [];
    balance: number;
    deposit: number;
  };
};
