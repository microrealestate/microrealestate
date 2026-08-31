import { DateFormat } from '@microrealestate/common';
import {
  LEASE_TIME_RANGES,
  type LeaseTimeRange,
  type Payment,
  type PropertyType,
  type Rent
} from '@microrealestate/shared';
import _ from 'lodash';
import moment from 'moment';
import * as BL from '../businesslogic';

interface ContractExpense {
  title: string;
  amount: number;
  beginDate?: string;
  endDate?: string;
}

export interface ContractProperty {
  propertyId: string;
  property?: Omit<PropertyType, '_id' | 'realmId'>;
  rent?: number;
  expenses?: ContractExpense[];
  entryDate?: string;
  exitDate?: string;
}

export interface Contract {
  begin: string;
  end: string;
  termination?: string;
  frequency: LeaseTimeRange;
  properties: ContractProperty[];
  terms?: number;
  rents?: Rent[];
  vatRate?: number;
  discount?: number;
}

export type Settlement = Partial<
  Pick<Rent, 'vats' | 'discounts' | 'debts' | 'description'>
> & {
  payments?: (Partial<Omit<Payment, 'amount'>> & Pick<Payment, 'amount'>)[];
};

export function create(contract: Contract): Contract {
  if (!contract.frequency || !LEASE_TIME_RANGES.includes(contract.frequency)) {
    throw Error(
      `unsupported frequency, should be one of these ${LEASE_TIME_RANGES.join(
        ', '
      )}`
    );
  }

  if (!contract.properties || contract.properties.length === 0) {
    throw Error('properties not defined or empty');
  }

  const momentBegin = moment(contract.begin, DateFormat.DATE_FORMAT);
  const momentEnd = moment(contract.end, DateFormat.DATE_FORMAT);
  let momentTermination: moment.Moment | undefined;
  if (contract.termination) {
    momentTermination = moment(contract.termination, DateFormat.DATE_FORMAT);
    if (!momentTermination.isBetween(momentBegin, momentEnd, 'minutes', '[]')) {
      throw Error('termination date is out of the contract time frame');
    }
  }

  if (momentEnd.isSameOrBefore(momentBegin)) {
    throw Error(
      'contract duration is not correct, check begin/end contract date'
    );
  }

  const terms = Math.round(
    momentEnd.diff(
      momentBegin,
      contract.frequency as moment.unitOfTime.Base,
      true
    )
  );

  const updatedContract: Contract = {
    ...contract,
    terms,
    rents: []
  };

  const current = moment(momentBegin);
  let previousRent: Rent | undefined;
  while (
    current.isSameOrBefore(
      momentTermination || momentEnd,
      contract.frequency as moment.unitOfTime.Base
    )
  ) {
    const rent = BL.computeRent(updatedContract, current, previousRent);
    updatedContract.rents?.push(rent);
    previousRent = rent;
    current.add(1, contract.frequency as moment.unitOfTime.Base);
  }
  return updatedContract;
}

export function update(
  inputContract: Contract,
  modification: Partial<Contract>
): Contract {
  const originalContract = _.cloneDeep(inputContract);
  const modifiedContract: Contract = {
    ...originalContract,
    ...modification
  };

  const momentBegin = moment(modifiedContract.begin, DateFormat.DATE_FORMAT);
  const momentEnd = moment(modifiedContract.end, DateFormat.DATE_FORMAT);
  let momentTermination: moment.Moment | undefined;
  if (modifiedContract.termination) {
    momentTermination = moment(
      modifiedContract.termination,
      DateFormat.DATE_FORMAT
    );
  }

  const oldMomentBegin = moment(inputContract.begin, DateFormat.DATE_FORMAT);
  const oldMomentEnd = moment(inputContract.end, DateFormat.DATE_FORMAT);
  const oldMomentTermination = inputContract.termination
    ? moment(inputContract.termination, DateFormat.DATE_FORMAT)
    : null;

  const oldEffectiveEnd = oldMomentTermination || oldMomentEnd;
  const newEffectiveEnd = momentTermination || momentEnd;

  // Skip check if timeframe is extended (new end >= old end AND new begin <= old begin)
  const isExtension =
    newEffectiveEnd.isSameOrAfter(oldEffectiveEnd) &&
    momentBegin.isSameOrBefore(oldMomentBegin);

  if (!isExtension) {
    // Check possible payments loss
    _checkLostPayments(momentBegin, newEffectiveEnd, inputContract);
  }

  const updatedContract = create(modifiedContract);

  if (inputContract.rents) {
    inputContract.rents
      .filter((rent) => _isPayment(rent))
      .forEach((paidRent) => {
        payTerm(updatedContract, String(paidRent.term), {
          payments: paidRent.payments,
          vats: paidRent.vats.filter((vat) => vat.origin === 'settlement'),
          discounts: paidRent.discounts.filter(
            (discount) => discount.origin === 'settlement'
          ),
          debts: paidRent.debts.filter(
            (debt) => debt.amount && debt.amount > 0
          ),
          description: paidRent.description
        });
      });
  }

  return updatedContract;
}

export function renew(contract: Contract): Contract {
  const momentEnd = moment(contract.end, DateFormat.DATE_FORMAT);
  const momentNewEnd = moment(momentEnd).add(
    contract.terms,
    contract.frequency as moment.unitOfTime.Base
  );

  const properties = _.cloneDeep(contract.properties);
  properties.forEach((property) => {
    const exitDate = moment(property.exitDate, DateFormat.DATE_FORMAT);
    if (exitDate.isSame(momentEnd)) {
      property.exitDate = momentNewEnd.format(DateFormat.DATE_FORMAT);
    }
    property.expenses?.forEach((expense) => {
      if (!expense.endDate) {
        return;
      }
      const endDate = moment(expense.endDate, DateFormat.DATE_FORMAT);
      if (endDate.isSame(momentEnd)) {
        expense.endDate = momentNewEnd.format(DateFormat.DATE_FORMAT);
      }
    });
  });

  return {
    ...update(
      { ...contract, properties },
      { end: momentNewEnd.format(DateFormat.DATE_FORMAT) }
    ),
    terms: contract.terms
  };
}

export function payTerm(
  contract: Contract,
  term: string,
  settlements: Settlement
): Contract {
  if (!contract.rents?.length) {
    throw Error('cannot pay term, the rents were not generated');
  }
  const current = moment(term, 'YYYYMMDDHH');
  const momentBegin = moment(contract.begin, DateFormat.DATE_FORMAT);
  const momentEnd = moment(
    contract.termination || contract.end,
    DateFormat.DATE_FORMAT
  );

  if (
    !current.isBetween(
      momentBegin,
      momentEnd,
      contract.frequency as moment.unitOfTime.Base,
      '[]'
    )
  ) {
    throw Error('payment term is out of the contract time frame');
  }

  const rents = contract.rents;

  const previousTerm = moment(current).subtract(
    1,
    contract.frequency as moment.unitOfTime.Base
  );
  const previousRentIndex = rents.findIndex(
    (rent) => rent.term === Number(previousTerm.format('YYYYMMDDHH'))
  );

  let previousRent =
    previousRentIndex > -1 ? rents[previousRentIndex] : undefined;

  let currentSettlements: Settlement | undefined = settlements;

  rents.forEach((rent, index) => {
    if (index > previousRentIndex) {
      if (index > previousRentIndex + 1) {
        const { debts, discounts, payments } = rent;
        currentSettlements = {
          debts,
          discounts: discounts.filter((d) => d.origin === 'settlement'),
          payments
        };
      }
      rents[index] = BL.computeRent(
        contract,
        current,
        previousRent,
        currentSettlements
      );
      previousRent = rents[index];
      current.add(1, contract.frequency as moment.unitOfTime.Base);
    }
  });

  return contract;
}

const _isPayment = (rent: Rent): boolean => {
  return (
    rent.payments.some((payment) => payment.amount && payment.amount > 0) ||
    rent.discounts.some(
      (discount) =>
        discount.origin === 'settlement' &&
        discount.amount &&
        discount.amount > 0
    ) ||
    rent.debts.some((debt) => debt.amount && debt.amount > 0) ||
    !!rent.description
  );
};

const _checkLostPayments = (
  momentBegin: moment.Moment,
  momentEnd: moment.Moment,
  contract: Contract
): void => {
  const rents = contract.rents;
  if (!rents?.length) {
    return;
  }

  const lostPayments = rents
    .filter(
      (rent) =>
        !moment(rent.term, 'YYYYMMDDHH').isBetween(
          momentBegin,
          momentEnd,
          contract.frequency as moment.unitOfTime.Base,
          '[]'
        ) && _isPayment(rent)
    )
    .map(
      (rent) =>
        String(rent.term) +
        ' ' +
        rent.payments.map((payment) => payment.amount).join(' + ')
    );

  if (lostPayments.length > 0) {
    throw Error(
      `Some payments will be lost because they are out of the contract time frame:\n${lostPayments.join(
        '\n'
      )}`
    );
  }
};
