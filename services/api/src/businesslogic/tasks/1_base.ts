import { DateFormat } from '@microrealestate/common';
import type { Rent } from '@microrealestate/shared';
import type { Moment } from 'moment';
import moment from 'moment';
import type { Contract, Settlement } from '../../managers/contract';

export default function taskBase(
  contract: Contract,
  rentDate: Moment,
  _previousRent: Rent | undefined,
  settlements: Settlement | undefined,
  rent: Rent
): Rent {
  const currentMoment = moment(rentDate);
  rent.term = Number(currentMoment.format('YYYYMMDDHH'));
  if (contract.frequency === 'months') {
    rent.term = Number(
      moment(currentMoment).startOf('month').format('YYYYMMDDHH')
    );
  }
  if (contract.frequency === 'days') {
    rent.term = Number(
      moment(currentMoment).startOf('day').format('YYYYMMDDHH')
    );
  }
  if (contract.frequency === 'hours') {
    rent.term = Number(
      moment(currentMoment).startOf('hour').format('YYYYMMDDHH')
    );
  }
  contract.properties
    .filter((property) => {
      const entryMoment = moment(
        property.entryDate,
        DateFormat.DATE_FORMAT
      ).startOf('day');
      const exitMoment = moment(
        property.exitDate,
        DateFormat.DATE_FORMAT
      ).endOf('day');

      return currentMoment.isBetween(
        entryMoment,
        exitMoment,
        contract.frequency,
        '[]'
      );
    })
    .forEach((property) => {
      if (property.property) {
        const name = property.property.name || '';
        const preTaxAmount = property.rent || 0;
        const expenses = property.expenses || [];

        rent.preTaxAmounts.push({
          description: name,
          amount: preTaxAmount
        });

        if (expenses.length) {
          rent.charges.push(
            ...expenses
              .filter(({ beginDate, endDate }) => {
                // for ascending contract compatibility
                if (!(beginDate && endDate)) {
                  return true;
                }
                const expenseBegin = moment(
                  beginDate,
                  DateFormat.DATE_FORMAT
                ).startOf('day');
                const expenseEnd = moment(
                  endDate,
                  DateFormat.DATE_FORMAT
                ).endOf('day');

                return currentMoment.isBetween(
                  expenseBegin,
                  expenseEnd,
                  contract.frequency,
                  '[]'
                );
              })
              .filter(({ amount }) => amount != null)
              .map(({ title, amount }) => ({
                description: title,
                amount
              }))
          );
        }
      }
    });
  if (settlements) {
    rent.description = settlements.description || '';
  }
  return rent;
}
