import type { RentEmailName } from '../../../entities/email';
import type { Payment } from '../../../entities/tenant';
import type { OccupantData } from '../tenant/types';

/** Aggregates computed in `_getRentsDataByTerm` for the landlord rents month view */
export type RentMonthOverview = {
  countAll: number;
  countPaid: number;
  countPartiallyPaid: number;
  countNotPaid: number;
  totalToPay: number;
  totalPaid: number;
  totalNotPaid: number;
};

/** PATCH body for recording payments / promo / extracharge on a rent term */
export type PatchRentPaymentRequestBody = {
  _id: string;
  payments?: (Partial<Pick<Payment, 'type' | 'reference'>> & {
    amount?: number;
    date?: string | null;
    description?: string;
  })[];
  promo?: number;
  notepromo?: string | null;
  extracharge?: number;
  noteextracharge?: string | null;
  description?: string;
};

export type RentEmailSendRecord = {
  /** Every address the message went to: the engine sends one email to all of a tenant's contacts. */
  sentTo: string[];
  sentDate: string;
};

/**
 * Email status block attached by `toRentData` when an occupant + emailStatus map are present.
 * Spread `...emailStatus` adds dynamic template keys mapped to send-record arrays.
 */
export type RentEmailStatusPayload = {
  /** Whether each rent document has ever been sent for this term. */
  status: Record<RentEmailName, boolean>;
  /** The most recent send of each, when there is one. */
  last: Partial<Record<RentEmailName, RentEmailSendRecord>>;
  /** How many times each was sent. `allRentnotice` sums the notices only, excluding the receipt. */
  count: Record<RentEmailName, number> & { allRentnotice: number };
  /** The raw per-template arrays, spread on by `toRentData`. */
} & Record<string, RentEmailSendRecord[] | unknown>;

/**
 * JSON shape returned by `frontdata.toRentData` (landlord rent row / detail).
 * Optional fields depend on whether occupant and email status were passed in.
 */
export type RentViewData = {
  _id?: string;
  term: number;
  balance: number;
  newBalance: number;
  hasMultiplePayments: boolean;
  payment: number;
  payments?: (Payment & { description?: string })[];
  discount: number;
  totalAmount: number;
  totalWithoutBalanceAmount: number;
  totalToPay: number;
  description?: string;
  countMonthNotPaid: number;
  paymentStatus: { month: number; status: string }[];
  promo?: number;
  notepromo?: string;
  extracharge?: number;
  noteextracharge?: string;
  totalWithoutVatAmount?: number;
  vatAmount?: number;
  status: string;
  emailStatus?: RentEmailStatusPayload;
  occupant?: OccupantData;
  vatRatio?: number;
  uid?: string;
  active?: string;
};
