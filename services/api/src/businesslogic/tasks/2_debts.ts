import type { Rent } from '@microrealestate/shared';
import type { Moment } from 'moment';
import type { Contract, Settlement } from '../../managers/contract';

export default function taskDebts(
  _contract: Contract,
  _rentDate: Moment,
  _previousRent: Rent | undefined,
  settlements: Settlement | undefined,
  rent: Rent
): Rent {
  if (settlements?.debts) {
    settlements.debts.forEach((debt) => {
      rent.debts.push({
        description: debt.description,
        amount: debt.amount
      });
    });
  }
  return rent;
}
