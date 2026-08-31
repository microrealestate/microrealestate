import type {
  Locale,
  PaymentMethod,
  PropertyKind
} from '@microrealestate/shared';

export type Chunk = string | { field: string; label: string };

export type Line = Chunk[];

export type DemoProperty = {
  name: string;
  type: PropertyKind;
  description: string;
  surface: number;
  price: number;
  phone?: string;
  digicode?: string;
  address: {
    street1: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
  };
};

export type SettlementProfile =
  // every term settled, current one included
  | 'up-to-date'
  // current term half paid
  | 'partial-current'
  // current term unsettled
  | 'late-one'
  // current and previous term unsettled, the one before half paid
  | 'late-two';

export type DemoTenant = {
  name: string;
  isCompany: boolean;
  company?: string;
  manager?: string;
  legalForm?: string;
  siret?: string;
  capital?: number;
  street1: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  contacts: { name: string; email: string; phone1: string }[];
  isVat: boolean;
  vatRatio: number;
  // feeds the {{lease.deposit}} merge field
  expectedSecurityDeposit: number;
  // the deposit is recorded as settled
  depositPaid: boolean;
  // months before today the lease started
  beginMonthsAgo: number;
  // months after today the lease ends
  endMonthsAhead: number;
  // property names, matched against the dataset properties
  properties: { name: string; expense: number }[];
  settlement: SettlementProfile;
};

export type DemoLeaseTemplate = {
  name: string;
  title: Line;
  intro: Line[];
  clauses: { heading: string; lines: Line[] }[];
  closing: Line[];
};

export type DemoFileDescriptor = {
  name: string;
  description: string;
  hasExpiryDate: boolean;
  required: boolean;
  requiredOnceContractTerminated: boolean;
};

export type DemoDataset = {
  locale: Locale;
  currency: string;
  credentials: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  };
  organization: {
    name: string;
    address: {
      street1: string;
      zipCode: string;
      city: string;
      state: string;
      country: string;
    };
    phone: string;
    bankName: string;
    iban: string;
  };
  contract: { name: string; description: string };
  properties: DemoProperty[];
  tenants: DemoTenant[];
  leaseTemplate: DemoLeaseTemplate;
  fileDescriptors: DemoFileDescriptor[];
  expenseTitle: string;
  paymentReferencePrefix: string;
  paymentMethod: PaymentMethod;
};
