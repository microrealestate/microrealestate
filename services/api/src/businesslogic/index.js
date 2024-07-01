/* eslint-disable sort-imports */
import taskBase from './tasks/1_base.js';
import taskDebts from './tasks/2_debts.js';
import taskDiscounts from './tasks/3_discounts.js';
import taskVATs from './tasks/4_vats.js';
import taskBalance from './tasks/5_balance.js';
import taskPayments from './tasks/6_payments.js';
import taskTotal from './tasks/7_total.js';

export function computeRent(contract, rentDate, previousRent, settlements) {
  let rent = {
    term: 0,
    month: 0,
    year: 0,
    preTaxAmounts: [
      // {
      //     description: '',
      //     amount: ''
      // }
    ],
    charges: [
      // {
      //     description: '',
      //     amount: ''
      // }
    ],
    discounts: [
      // {
      //     origin: '',  // 'contract', 'settlement'
      //     description: '',
      //     amount: ''
      // }
    ],
    debts: [
      // {
      //     description: '',
      //     amount: ''
      // }
    ],
    vats: [
      // {
      //     origin: '',  // 'contract', 'settlement'
      //     description: '',
      //     rate: 0,
      //     amount: 0
      // }
    ],
    payments: [
      // {
      //     date: '',
      //     amount: 0,
      //     type: '',
      //     reference: ''
      // }
    ],
    description: '',
    total: {
      balance: 0,
      preTaxAmount: 0,
      charges: 0,
      discount: 0,
      vat: 0,
      grandTotal: 0,
      payment: 0
    }
  };

  [
    taskBase,
    taskDebts,
    taskDiscounts,
    taskVATs,
    taskBalance,
    taskPayments,
    taskTotal
  ].forEach(async (task) => {
    rent = task(contract, rentDate, previousRent, settlements, rent);
  });

  return rent;
}
