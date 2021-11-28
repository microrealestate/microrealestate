/* eslint-env node, mocha */
const Contract = require('../../managers/contract');

describe('contract functionalities', () => {
  it('create contract', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });

    expect(contract.terms).toEqual(108); // incorrect number of terms
    expect(contract.rents.length).toEqual(108); // incorrect number of rents

    expect(() => {
      Contract.create({
        begin: '01/01/2017 00:00',
        end: '01/01/2017 03:00',
        frequency: 'hours',
      });
    }).toThrow();

    expect(() => {
      Contract.create({
        begin: '01/01/2017 00:00',
        end: '01/01/2016 03:00',
        frequency: 'hours',
        properties: [{}, {}],
      });
    }).toThrow();

    expect(() => {
      Contract.create();
    }).toThrow();
  });

  it('check term frequency', () => {
    let c1;
    let c2;
    let c3;
    let c4;
    let c5;

    expect(() => {
      c1 = Contract.create({
        begin: '01/01/2017 00:00',
        end: '01/01/2017 03:00',
        frequency: 'hours',
        properties: [{}, {}],
      });
      c2 = Contract.create({
        begin: '01/01/2017 00:00',
        end: '31/01/2017 23:59',
        frequency: 'days',
        properties: [{}, {}],
      });
      c3 = Contract.create({
        begin: '01/01/2017 00:00',
        end: '14/01/2017 23:59',
        frequency: 'weeks',
        properties: [{}, {}],
      });
      c4 = Contract.create({
        begin: '01/01/2017 00:00',
        end: '31/12/2017 23:59',
        frequency: 'months',
        properties: [{}, {}],
      });
      c5 = Contract.create({
        begin: '01/01/2017 00:00',
        end: '31/12/2025 23:59',
        frequency: 'years',
        properties: [{}, {}],
      });
    }).not.toThrow();

    expect(c1.terms).toEqual(3); // incorrect number of terms
    expect(c2.terms).toEqual(31); // incorrect number of terms
    expect(c3.terms).toEqual(2); // incorrect number of terms
    expect(c4.terms).toEqual(12); // incorrect number of terms
    expect(c5.terms).toEqual(9); // incorrect number of terms

    expect(() => {
      Contract.create({
        begin: '01/01/2017 00:00',
        end: '01/01/2017 03:00',
        frequency: 'blabla',
        properties: [{}, {}],
      });
    }).toThrow();
  });

  it('renew contract based on initial number of terms', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    const newContract = Contract.renew(contract);

    expect(newContract.terms).toEqual(108); // incorrect number of terms
    expect(newContract.rents.length).toEqual(108 * 2); // incorrect number of rents
  });

  it('update contract change duration', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    const newContract = Contract.update(contract, { end: '31/03/2026 23:59' });

    expect(newContract.terms).toEqual(108 + 3); // incorrect number of terms
    expect(newContract.rents.length).toEqual(108 + 3); // incorrect number of rents

    const newContract2 = Contract.update(contract, {
      begin: '01/01/2018 00:00',
    });
    expect(newContract2.terms).toEqual(108 - 12); // incorrect number of terms
    expect(newContract2.rents.length).toEqual(108 - 12); // incorrect number of rents
  });

  it('update contract which has a payment', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    Contract.payTerm(contract, '01/01/2017 00:00', {
      payments: [{ amount: 200 }],
      debts: [{ description: 'extra', amount: 100 }],
      discounts: [{ origin: 'settlement', description: '', amount: 100 }],
    });
    const newContract = Contract.update(contract, { end: '31/03/2026 23:59' });

    expect(newContract.terms).toEqual(108 + 3); // incorrect number of terms
    expect(newContract.rents.length).toEqual(108 + 3); // incorrect number of rents

    expect(
      contract.rents.filter((rent) => rent.payments.length !== 0).length
    ).toEqual(1);

    const firstRent = contract.rents.find((rent) => rent.term === 2017010100);
    expect(firstRent.payments[0].amount).toEqual(200);
    expect(firstRent.debts[0].amount).toEqual(100);
    expect(firstRent.discounts[0].amount).toEqual(100);
  });

  it('terminate contract', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    const newContract = Contract.terminate(contract, '31/12/2017 23:59');

    expect(newContract.terms).toEqual(108); // incorrect number of terms
    expect(newContract.rents.length).toEqual(12); // incorrect number of rents
    expect(newContract.begin).toBe('01/01/2017 00:00'); // begin contract date incorrect
    expect(newContract.end).toBe('31/12/2025 23:59'); // end contract date incorrect
    expect(newContract.termination).toBe('31/12/2017 23:59'); // termination contract date incorrect

    // after end date of contract
    expect(() => {
      Contract.terminate(contract, '31/12/2026 23:59');
    }).toThrow();

    // before begin date of contract
    expect(() => {
      Contract.terminate(contract, '01/01/2016 00:00');
    });
  });

  it('update termination date', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    const tmpContract = Contract.terminate(contract, '31/12/2017 23:59');
    const longerContract = Contract.terminate(tmpContract, '31/12/2018 23:59');

    expect(longerContract.terms).toEqual(108); // incorrect number of terms
    expect(longerContract.rents.length).toEqual(24); // incorrect number of rents
    expect(longerContract.begin).toBe('01/01/2017 00:00'); // begin contract date incorrect
    expect(longerContract.end).toBe('31/12/2025 23:59'); // end contract date incorrect
    expect(longerContract.termination).toBe('31/12/2018 23:59'); // termination contract date incorrect

    const shorterContract = Contract.terminate(
      longerContract,
      '30/06/2017 23:59'
    );
    expect(shorterContract.terms).toEqual(108); // incorrect number of terms
    expect(shorterContract.rents.length).toEqual(6); // incorrect number of rents
    expect(shorterContract.begin).toBe('01/01/2017 00:00'); // begin contract date incorrect
    expect(shorterContract.end).toBe('31/12/2025 23:59'); // end contract date incorrect
    expect(shorterContract.termination).toBe('30/06/2017 23:59'); // termination contract date incorrect
  });

  it('terminate contract and change contract duration', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    const terminateContract = Contract.terminate(contract, '31/12/2017 23:59');
    const newContract = Contract.update(terminateContract, {
      end: '31/03/2026 23:59',
    });

    expect(newContract.terms).toEqual(108 + 3); // incorrect number of terms
    expect(newContract.rents.length).toEqual(12); // incorrect number of rents
    expect(newContract.begin).toBe('01/01/2017 00:00'); // begin contract date incorrect
    expect(newContract.end).toBe('31/03/2026 23:59'); // end contract date incorrect
    expect(newContract.termination).toBe('31/12/2017 23:59'); // termination contract date incorrect

    // termination date after end contract
    expect(() => {
      Contract.update(terminateContract, { end: '30/12/2017 23:59' });
    }).toThrow();

    // termination date before begin contract
    expect(() => {
      Contract.update(terminateContract, { begin: '01/01/2018 23:59' });
    }).toThrow();
  });

  it('pay a term', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    Contract.payTerm(contract, '01/12/2025 00:00', {
      payments: [{ amount: 200 }],
      discounts: ['discount'],
    });

    expect(
      contract.rents.filter((rent) => rent.payments.length === 0).length
    ).toEqual(contract.terms - 1);
    expect(
      contract.rents.find((rent) => rent.term === 2025120100).payments[0].amount
    ).toEqual(200);
    expect(contract.terms).toEqual(108); // incorrect number of terms
    expect(contract.rents.length).toEqual(108); // incorrect number of rents

    expect(() => {
      Contract.payTerm(contract, '01/12/2026 00:00', {
        payments: [{ amount: 200 }],
        discounts: ['discount'],
      });
    }).toThrow();

    expect(() => {
      Contract.payTerm(contract, '01/12/2016 00:00', {
        payments: [{ amount: 200 }],
        discounts: ['discount'],
      });
    }).toThrow();
  });

  it('pay first term', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    Contract.payTerm(contract, '01/01/2017 00:00', {
      payments: [{ amount: 200 }],
      discounts: ['discount'],
    });

    expect(
      contract.rents.find((rent) => rent.term === 2017010100).payments[0].amount
    ).toEqual(200);
    expect(
      contract.rents.findIndex((rent) => rent.term === 2017010100)
    ).toEqual(0);
  });

  it('pay last term', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    Contract.payTerm(contract, '01/12/2025 00:00', {
      payments: [{ amount: 200 }],
      discounts: ['discount'],
    });

    expect(
      contract.rents.find((rent) => rent.term === 2025120100).payments[0].amount
    ).toEqual(200);
    expect(
      contract.rents.findIndex((rent) => rent.term === 2025120100)
    ).toEqual(contract.rents.length - 1);
  });

  it('pay a term in reverse chronological order', () => {
    const contract = Contract.create({
      begin: '01/01/2020 00:00',
      end: '31/12/2020 23:59',
      frequency: 'months',
      vatRate: 0.2,
      properties: [
        {
          entryDate: '01/01/2020',
          exitDate: '31/12/2020',
          property: {
            name: 'office1',
            price: 100,
          },
          rent: 100,
          expenses: [{ title: 'expense', amount: 10 }],
        },
      ],
    });

    let termAmount = (100 + 10) * 1.2; // VAT
    expect(
      contract.rents.find((rent) => rent.term === 2020020100).total.balance
    ).toEqual(termAmount);

    Contract.payTerm(contract, '01/05/2020 00:00', {
      payments: [{ amount: termAmount }],
    });
    Contract.payTerm(contract, '01/04/2020 00:00', {
      payments: [{ amount: termAmount }],
    });
    Contract.payTerm(contract, '01/03/2020 00:00', {
      payments: [{ amount: termAmount }],
    });
    Contract.payTerm(contract, '01/02/2020 00:00', {
      payments: [{ amount: termAmount }],
    });
    Contract.payTerm(contract, '01/01/2020 00:00', {
      payments: [{ amount: termAmount }],
    });

    expect(
      contract.rents.find((rent) => rent.term === 2020060100).total.balance
    ).toEqual(0);
  });

  it('pay a term and update contract duration', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    Contract.payTerm(contract, '01/12/2025 00:00', {
      payments: [{ amount: 200 }],
      discounts: ['discount'],
    });

    const newContract = Contract.update(contract, {
      begin: '01/01/2019 00:00',
      end: '31/12/2025 23:59',
    });
    expect(
      newContract.rents.find((rent) => rent.term === 2025120100).payments[0]
        .amount
    ).toEqual(200);

    // payment out of contract time frame
    expect(() => {
      Contract.update(contract, {
        begin: '01/01/2019 00:00',
        end: '31/12/2024 23:59',
      });
    }).toThrow();
  });

  it('pay terms and update contract properties', () => {
    const p1 = {
      entryDate: '01/01/2020',
      exitDate: '31/12/2020',
      property: {
        name: 'office1',
        price: 300,
      },
      rent: 300,
      expenses: [{ title: 'expense', amount: 10 }],
    };

    let termP1 =
      p1.rent +
      p1.expenses.reduce((acc, { amount }) => {
        acc += amount;
        return acc;
      }, 0);
    termP1 *= 1.2; // VAT

    const contract = Contract.create({
      begin: '01/01/2020 00:00',
      end: '31/12/2020 23:59',
      frequency: 'months',
      vatRate: 0.2,
      properties: [p1],
    });
    Contract.payTerm(contract, '01/01/2020 00:00', {
      payments: [{ amount: 372 }],
    });
    Contract.payTerm(contract, '01/02/2020 00:00', {
      payments: [{ amount: 372 }],
    });
    Contract.payTerm(contract, '01/03/2020 00:00', {
      payments: [{ amount: 372 }],
    });
    Contract.payTerm(contract, '01/04/2020 00:00', {
      payments: [{ amount: 372 }],
    });
    Contract.payTerm(contract, '01/05/2020 00:00', {
      payments: [{ amount: 372 }],
    });
    Contract.payTerm(contract, '01/06/2020 00:00', {
      payments: [{ amount: 372 }],
    });

    let termsGrandTotal = Array(contract.terms)
      .fill(1)
      .reduce((acc, value, index) => {
        const prevTerm = index > 6 ? acc[index - 1] : 0;
        const currentTerm = prevTerm + termP1;
        acc.push(currentTerm);
        return acc;
      }, []);

    expect(contract.rents.map((r) => r.total.grandTotal)).toEqual(
      termsGrandTotal
    );

    // update contract with a new properties
    const p2 = {
      entryDate: '01/02/2020',
      exitDate: '31/12/2020',
      property: {
        name: 'office',
        price: 320,
      },
      rent: 320,
      expenses: [{ title: 'expense', amount: 32 }],
    };

    let termP2 =
      p2.rent +
      p2.expenses.reduce((acc, { amount }) => {
        acc += amount;
        return acc;
      }, 0);
    termP2 *= 1.2; // VAT

    const newContract = Contract.update(contract, { properties: [p1, p2] });

    termsGrandTotal = [
      Math.round(termP1 * 10) / 10, // jan
      Math.round((termP1 + termP2) * 10) / 10, // feb
      Math.round((termP1 + 2 * termP2) * 10) / 10, // mar
      Math.round((termP1 + 3 * termP2) * 10) / 10, // apr
      Math.round((termP1 + 4 * termP2) * 10) / 10, // may
      Math.round((termP1 + 5 * termP2) * 10) / 10, // jun
      Math.round((termP1 + 6 * termP2) * 10) / 10, // jul
      Math.round((2 * termP1 + 7 * termP2) * 10) / 10, // aou
      Math.round((3 * termP1 + 8 * termP2) * 10) / 10, // sep
      Math.round((4 * termP1 + 9 * termP2) * 10) / 10, // oct
      Math.round((5 * termP1 + 10 * termP2) * 10) / 10, // nov
      Math.round((6 * termP1 + 11 * termP2) * 10) / 10, // dec
    ];

    expect(newContract.rents.map((r) => r.total.grandTotal)).toEqual(
      termsGrandTotal
    );
  });

  it('pay a term and renew', () => {
    const contract = Contract.create({
      begin: '01/01/2017 00:00',
      end: '31/12/2025 23:59',
      frequency: 'months',
      properties: [{}, {}],
    });
    Contract.payTerm(contract, '01/12/2025 00:00', {
      payments: [{ amount: 200 }],
      discounts: ['discount'],
    });
    const newContract = Contract.renew(contract);

    expect(
      newContract.rents.filter((rent) => rent.payments.length === 0).length
    ).toEqual(contract.terms * 2 - 1);
    expect(
      newContract.rents.find((rent) => rent.term === 2025120100).payments[0]
        .amount
    ).toEqual(200);
    expect(newContract.terms).toEqual(108); // incorrect number of terms
    expect(newContract.rents.length).toEqual(108 * 2); // incorrect number of rents
  });

  it('compute terms', () => {
    const property = {
      entryDate: '01/01/2020',
      exitDate: '31/08/2020',
      property: {
        name: 'mon bureau',
        price: 300,
      },
      rent: 300,
      expenses: [{ title: 'expense', amount: 10 }],
    };

    let rentAmountProperty1 =
      property.rent +
      property.expenses.reduce((acc, { amount }) => {
        acc += amount;
        return acc;
      }, 0);
    rentAmountProperty1 *= 1.2; // VAT

    const contract = Contract.create({
      begin: '01/01/2020 00:00',
      end: '31/12/2020 23:59',
      frequency: 'months',
      vatRate: 0.2,
      properties: [property],
    });

    const termsGrandTotal = Array(contract.terms)
      .fill(1)
      .reduce((acc, value, index) => {
        const prevTerm = index > 0 ? acc[index - 1] : 0;
        const currentTerm =
          index > 7 ? prevTerm : prevTerm + rentAmountProperty1; // 7 because property rented for 8 months
        acc.push(currentTerm);
        return acc;
      }, []);

    expect(contract.rents.map((r) => r.total.grandTotal)).toEqual(
      termsGrandTotal
    );
  });

  it('compute terms of two properties', () => {
    const p1 = {
      entryDate: '01/01/2020',
      exitDate: '31/12/2020',
      property: {
        name: 'office1',
        price: 300,
      },
      rent: 300,
      expenses: [{ title: 'expense', amount: 10 }],
    };

    let termP1 =
      p1.rent +
      p1.expenses.reduce((acc, { amount }) => {
        acc += amount;
        return acc;
      }, 0);
    termP1 *= 1.2; // VAT

    const p2 = {
      entryDate: '01/07/2020',
      exitDate: '31/12/2020',
      property: {
        name: 'office',
        price: 320,
      },
      rent: 320,
      expenses: [{ title: 'expense', amount: 32 }],
    };

    let termP2 =
      p2.rent +
      p2.expenses.reduce((acc, { amount }) => {
        acc += amount;
        return acc;
      }, 0);
    termP2 *= 1.2; // VAT

    const contract = Contract.create({
      begin: '01/01/2020 00:00',
      end: '31/12/2020 23:59',
      frequency: 'months',
      vatRate: 0.2,
      properties: [p1, p2],
    });

    const termsGrandTotal = Array(contract.terms)
      .fill(1)
      .reduce((acc, value, index) => {
        const prevTerm = index > 0 ? acc[index - 1] : 0;
        const currentTerm =
          Math.round(
            (index > 5 ? prevTerm + termP1 + termP2 : prevTerm + termP1) * 10
          ) / 10; // 5 because after July 2 properties are rented
        acc.push(currentTerm);
        return acc;
      }, []);

    expect(contract.rents.map((r) => r.total.grandTotal)).toEqual(
      termsGrandTotal
    );
  });
});
