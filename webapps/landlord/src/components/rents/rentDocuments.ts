import type { RentEmailName } from '@microrealestate/shared';
import type { ComponentType } from 'react';
import {
  LastReminderDocumentIcon,
  ReceiptDocumentIcon,
  ReminderDocumentIcon,
  RentNoticeDocumentIcon
} from './DocumentIcon';
import { rentStatus } from './rentView';
import type { MonthRent } from './types';

export type RentDocument = {
  name: RentEmailName;
  Icon: ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  shortLabel: string;
  description: string;
  fileLabel: string;
};

export const RENT_DOCUMENTS: RentDocument[] = [
  {
    name: 'rentnotice',
    Icon: RentNoticeDocumentIcon,
    tone: 'text-muted-foreground',
    label: 'Payment notice',
    shortLabel: 'Notice',
    description: 'The amount due this month and the date to pay it.',
    fileLabel: 'first notice'
  },
  {
    name: 'rentnotice_reminder',
    Icon: ReminderDocumentIcon,
    tone: 'text-warning',
    label: 'Payment notice reminder',
    shortLabel: 'Reminder',
    description: 'Tells the tenant the rent is late and asks them to pay now.',
    fileLabel: 'reminder notice'
  },
  {
    name: 'rentnotice_last_reminder',
    Icon: LastReminderDocumentIcon,
    tone: 'text-destructive',
    label: 'Final reminder before legal action',
    shortLabel: 'Final reminder',
    description:
      'A last reminder to the tenant to pay the overdue rent before legal action.',
    fileLabel: 'final reminder before legal action'
  },
  {
    name: 'receipt',
    Icon: ReceiptDocumentIcon,
    tone: 'text-success',
    label: 'Receipt',
    shortLabel: 'Receipt',
    description: 'Confirms the rent paid this month.',
    fileLabel: 'receipt'
  }
];

export function hasPayment(rent: MonthRent) {
  return rent.payment > 0;
}

export function canGetReceipt(rent: MonthRent) {
  return hasPayment(rent) || rentStatus(rent) === 'paid';
}

export type SuggestedDocument = Exclude<
  RentEmailName,
  'rentnotice_last_reminder'
>;

export const SUGGESTION_REASONS: Record<SuggestedDocument, string> = {
  rentnotice:
    'No notice was sent for this month yet. We recommend the payment notice.',
  rentnotice_reminder:
    'The notice was sent and the rent is not fully paid. We recommend a reminder.',
  receipt: 'The rent is paid. We recommend the receipt.'
};

export function suggestedDocument(rents: MonthRent[]): SuggestedDocument {
  const allPaid =
    rents.length > 0 && rents.every((rent) => rentStatus(rent) === 'paid');
  if (allPaid) {
    return 'receipt';
  }
  if (rents.length !== 1) {
    return 'rentnotice';
  }
  const sent = rents[0].emailStatus?.status;
  if (
    sent?.rentnotice ||
    sent?.rentnotice_reminder ||
    sent?.rentnotice_last_reminder
  ) {
    return 'rentnotice_reminder';
  }
  return 'rentnotice';
}
