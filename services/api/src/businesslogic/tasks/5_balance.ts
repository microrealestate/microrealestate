import type { Rent } from '@microrealestate/shared';
import type { Moment } from 'moment';
import type { Contract, Settlement } from '../../managers/contract';

export default function taskBalance(
  _contract: Contract,
  _rentDate: Moment,
  previousRent: Rent | undefined,
  _settlements: Settlement | undefined,
  rent: Rent
): Rent {
  if (previousRent) {
    rent.total.balance =
      previousRent.total.grandTotal - previousRent.total.payment;
  }
  return rent;
}
