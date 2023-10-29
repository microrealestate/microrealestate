import { LOCALES } from '@/utils/i18n/common';

type Locale = Readonly<(typeof LOCALES)[number]>;
type LocalizedMessages = Record<string, string>;
type LocaleMap = Map<Locale, LocalizedMessages>;
type TFunction = (key: string, data?: Record<string, string>) => string;

interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
}

interface Session {
  user?: User;
}

interface Toast {
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContext {
  toast: Toast | null;
  setToast: (toast: Toast | null) => void;
}

type FormattedDate = string; // YYYY-MM-DD

interface Property {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Invoice {
  id: string;
  term: string;
  amount: number;
  status: 'paid' | 'unpaid';
  method: 'bank-transfer' | 'credit-card' | 'cash' | 'check';
}

interface Document {
  id: string;
  name: string;
  description: string;
}

interface Contract {
  name: string;
  tenantName: string;
  startDate: FormattedDate;
  endDate: FormattedDate;
  terminationDate: FormattedDate;
  status: 'active' | 'inactive';
  properties: Property[];
  balance: number;
  deposit: number;
  invoices: Invoice[];
  documents: Document[];
}
