import {
  LeaseStatus,
  LeaseTimeRange,
  Locale,
  PaymentMethod,
  PaymentStatus
} from '@microrealestate/types';

type LocalizedMessages = Record<
  string,
  string | Record<Intl.LDMLPluralRule, string>
>;
type LocaleMap = Map<Locale, LocalizedMessages>;
type TFunction = (
  key: string,
  data?: Record<string, string> | null,
  plural?: {
    type?: Intl.PluralRuleType;
    count: number;
    offset?: number;
  }
) => string;

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';
type Session = {
  email?: string;
};

type FormattedDate = string; // YYYY-MM-DD

type Property = {
  id: string;
  name: string;
  description?: string;
  type: string;
};

type Invoice = {
  id: string;
  term: number;
  grandTotal: number;
  payment: number;
  status: PaymentStatus;
  methods: PaymentMethod[] | [];
};

type Document = {
  id: string;
  name: string;
  description: string;
  url: string;
  versionId: string;
};

type Lease = {
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
  name: string;
  beginDate: Date | undefined;
  endDate: Date | undefined;
  terminationDate?: Date | undefined;
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
  properties: Property[];
  balance: number;
  deposit: number;
  invoices: Invoice[] | [];
  documents: Document[] | [];
};
