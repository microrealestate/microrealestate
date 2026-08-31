import type { Rent } from '@microrealestate/shared';
import type { Moment } from 'moment';
import type { Contract, Settlement } from '../managers/contract';
import taskBase from './tasks/1_base';
import taskDebts from './tasks/2_debts';
import taskDiscounts from './tasks/3_discounts';
import taskVATs from './tasks/4_vats';
import taskBalance from './tasks/5_balance';
import taskPayments from './tasks/6_payments';
import taskTotal from './tasks/7_total';

type RentTask = (
  contract: Contract,
  rentDate: Moment,
  previousRent: Rent | undefined,
  settlements: Settlement | undefined,
  rent: Rent
) => Rent;

export function computeRent(
  contract: Contract,
  rentDate: Moment,
  previousRent?: Rent,
  settlements?: Settlement
): Rent {
  let rent: Rent = {
    term: 0,
    preTaxAmounts: [],
    charges: [],
    discounts: [],
    debts: [],
    vats: [],
    payments: [],
    description: '',
    total: {
      balance: 0,
      preTaxAmount: 0,
      charges: 0,
      discount: 0,
      vat: 0,
      debts: 0,
      grandTotal: 0,
      payment: 0
    }
  };

  const tasks: RentTask[] = [
    taskBase,
    taskDebts,
    taskDiscounts,
    taskVATs,
    taskBalance,
    taskPayments,
    taskTotal
  ];

  for (const task of tasks) {
    rent = task(contract, rentDate, previousRent, settlements, rent);
  }

  return rent;
}
