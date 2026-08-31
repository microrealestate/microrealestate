export * from './environmentvalues';

export type CallerType = 'landlord' | 'tenant';

export type Address = {
  street1: string;
  street2?: string;
  zipCode?: string;
  city: string;
  state?: string;
  country?: string;
};

export type Contact = {
  name: string;
  email: string;
  phone1: string;
  phone2?: string;
};

export type CompanyInfo = {
  name: string;
  legalStructure?: string;
  legalRepresentative?: string;
  capital?: number;
  ein?: string;
  dos?: string;
  vatNumber?: string;
};

export type BankInfo = {
  name: string;
  iban: string;
};

export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};
