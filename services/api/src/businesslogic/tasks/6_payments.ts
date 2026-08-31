import type { Payment, Rent } from '@microrealestate/shared';
import type { Moment } from 'moment';
import type { Contract, Settlement } from '../../managers/contract';

export default function taskPayments(
  _contract: Contract,
  _rentDate: Moment,
  _previousRent: Rent | undefined,
  settlements: Settlement | undefined,
  rent: Rent
): Rent {
  if (settlements?.payments) {
    settlements.payments.forEach((payment) => {
      rent.payments.push({
        date: payment.date ?? '',
        amount: payment.amount,
        type: payment.type ?? 'transfer',
        reference: payment.reference ?? ''
      } satisfies Payment);
    });
  }
  return rent;
}
