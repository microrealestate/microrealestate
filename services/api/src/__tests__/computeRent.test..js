/* eslint-env node, mocha */
import * as BL from '../businesslogic/index.js';
import moment from 'moment';

describe('one property rented', () => {
  const property = {
    entryDate: moment('01/01/2017', 'DD/MM/YYYY').toDate(),
    exitDate: moment('31/08/2017', 'DD/MM/YYYY').toDate(),
    property: {
      name: 'mon bureau',
      price: 300
    },
    rent: 300,
    expenses: [{ title: 'expense', amount: 10 }]
  };
  const contract = {
    begin: '01/01/2017',
    end: '31/01/2017',
    discount: 10,
    vatRate: 0.2,
    properties: [property]
  };

  const grandTotal =
    Math.round(
      (property.rent +
        property.expenses.reduce((acc, { amount }) => {
          acc += amount;
          return acc;
        }, 0) -
        contract.discount) *
        (1 + contract.vatRate) *
        100
    ) / 100;

  it('check rent object structure', () => {
    const computedRent = BL.computeRent(contract, '01/01/2017');
    const rentMoment = moment('01/01/2017', 'DD/MM/YYYY HH:mm');
    expect(computedRent.term).toEqual(Number(rentMoment.format('YYYYMMDDHH')));
    expect(computedRent.month).toEqual(rentMoment.month() + 1);
    expect(computedRent.year).toEqual(rentMoment.year());
  });

  it('compute one rent', () => {
    const computedRent = BL.computeRent(contract, '01/01/2017');
    expect(computedRent.total.grandTotal).toEqual(grandTotal);
  });

  it('compute two rents and check balance', () => {
    const rentOne = BL.computeRent(contract, '01/01/2017');
    const rentTwo = BL.computeRent(contract, '01/01/2017', rentOne);
    expect(rentOne.total.grandTotal).toEqual(grandTotal);
    expect(rentTwo.total.balance).toEqual(grandTotal);
    expect(rentTwo.total.grandTotal).toEqual(grandTotal * 2);
  });
});

describe('two properties rented with one month offset', () => {
  const property1 = {
    entryDate: moment('01/01/2017', 'DD/MM/YYYY').toDate(),
    exitDate: moment('31/08/2017', 'DD/MM/YYYY').toDate(),
    property: {
      name: 'mon bureau',
      price: 300
    },
    rent: 300,
    expenses: [{ title: 'expense', amount: 10 }]
  };
  const property2 = {
    entryDate: moment('01/02/2017', 'DD/MM/YYYY').toDate(),
    exitDate: moment('31/08/2017', 'DD/MM/YYYY').toDate(),
    property: {
      name: 'mon parking',
      price: 30
    },
    rent: 30,
    expenses: [{ title: 'expense', amount: 5 }]
  };
  const contract = {
    begin: '01/01/2017',
    end: '31/01/2017',
    discount: 10,
    vatRate: 0.2,
    properties: [property1, property2]
  };
  const grandTotal1 =
    Math.round(
      (property1.property.price +
        property1.expenses.reduce((acc, { amount }) => {
          acc += amount;
          return acc;
        }, 0) -
        contract.discount) *
        (1 + contract.vatRate) *
        100
    ) / 100;
  const grandTotal2 =
    Math.round(
      (property2.property.price +
        property2.expenses.reduce((acc, { amount }) => {
          acc += amount;
          return acc;
        }, 0)) *
        (1 + contract.vatRate) *
        100
    ) / 100;

  it('compute one rent one property should be billed', () => {
    const computedRent = BL.computeRent(contract, '01/01/2017');
    expect(computedRent.total.grandTotal).toEqual(grandTotal1);
  });

  it('compute one rent two properties should be billed', () => {
    const computedRent = BL.computeRent(contract, '01/02/2017');
    expect(computedRent.total.grandTotal).toEqual(grandTotal1 + grandTotal2);
  });
});
