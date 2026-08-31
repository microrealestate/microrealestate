import type { Rent } from '@microrealestate/shared';
import type { Moment } from 'moment';
import type { Contract, Settlement } from '../../managers/contract';

export default function taskDiscounts(
  contract: Contract,
  _rentDate: Moment,
  _previousRent: Rent | undefined,
  settlements: Settlement | undefined,
  rent: Rent
): Rent {
  if (contract.discount) {
    rent.discounts.push({
      origin: 'contract',
      description: 'Remise exceptionnelle',
      amount: contract.discount
    });
  }

  if (settlements?.discounts) {
    settlements.discounts.forEach((discount) => {
      rent.discounts.push({
        origin: 'settlement',
        description: discount.description,
        amount: discount.amount
      });
    });
  }
  return rent;
}
