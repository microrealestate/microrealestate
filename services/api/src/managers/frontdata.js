import moment from 'moment';

export function toRentData(inputRent, inputOccupant, emailStatus) {
  const rent = JSON.parse(JSON.stringify(inputRent));
  const rentMoment = moment(String(rent.term), 'YYYYMMDDHH');

  let rentToReturn = {
    month: rent.month,
    year: rent.year,
    term: rent.term,
    balance: rent.total.balance,
    newBalance: rent.total.payment - rent.total.grandTotal,
    hasMultiplePayments: !!(rent.payments && rent.payments.length > 1),
    payment: rent.total.payment || 0,
    payments: rent.payments,
    discount: rent.total.discount,
    totalAmount: rent.total.grandTotal,
    totalWithoutBalanceAmount: rent.total.grandTotal - rent.total.balance,
    totalToPay: rent.total.grandTotal,
    description: rent.description,
    countMonthNotPaid: 0,
    paymentStatus: []
  };

  Object.assign(
    rentToReturn,
    rent.discounts
      .filter((discount) => discount.origin === 'settlement')
      .reduce(
        (acc, discount) => {
          return {
            promo: acc.promo + discount.amount,
            notepromo: `${acc.notepromo}${discount.description}\n`
          };
        },
        { promo: 0, notepromo: '' }
      )
  );

  Object.assign(
    rentToReturn,
    rent.debts.reduce(
      (acc, debt) => {
        return {
          extracharge: acc.extracharge + debt.amount,
          noteextracharge: `${acc.noteextracharge}${debt.description}\n`
        };
      },
      { extracharge: 0, noteextracharge: '' }
    )
  );

  // Get the first vat rate found in vats.
  const vatRate =
    rent.vats && rent.vats.length
      ? rent.vats.filter((vat) => vat.origin === 'contract')[0].rate
      : 0;
  if (vatRate) {
    if (rentToReturn.promo > 0) {
      rentToReturn.promo =
        Math.round(rentToReturn.promo * (1 + vatRate) * 100) / 100;
    }

    if (rentToReturn.extracharge > 0) {
      rentToReturn.extracharge =
        Math.round(rentToReturn.extracharge * (1 + vatRate) * 100) / 100;
    }
  }

  Object.assign(
    rentToReturn,
    rent.discounts
      .filter((discount) => discount.origin === 'contract')
      .reduce(
        (acc, discount) => {
          return {
            totalWithoutVatAmount: acc.totalWithoutVatAmount - discount.amount
          };
        },
        { totalWithoutVatAmount: rent.total.preTaxAmount + rent.total.charges }
      )
  );

  Object.assign(
    rentToReturn,
    rent.vats
      .filter((vat) => vat.origin === 'contract')
      .reduce(
        (acc, vat) => {
          return {
            vatAmount: acc.vatAmount + vat.amount
          };
        },
        { vatAmount: 0 }
      )
  );

  // payment status
  rentToReturn.status = '';
  if (rentMoment.isSameOrBefore(moment(), 'month')) {
    if (rentToReturn.totalAmount <= 0 || rentToReturn.newBalance >= 0) {
      rentToReturn.status = 'paid';
    } else if (rentToReturn.payment > 0) {
      rentToReturn.status = 'partiallypaid';
    } else {
      rentToReturn.status = 'notpaid';
    }
  }

  if (inputOccupant) {
    // email status
    if (emailStatus) {
      const computedEmailStatus = {
        status: {
          rentcall: !!(emailStatus.rentcall && emailStatus.rentcall.length),
          rentcall_reminder: !!(
            emailStatus.rentcall_reminder &&
            emailStatus.rentcall_reminder.length
          ),
          rentcall_last_reminder: !!(
            emailStatus.rentcall_last_reminder &&
            emailStatus.rentcall_last_reminder.length
          ),
          invoice: !!(emailStatus.invoice && emailStatus.invoice.length)
        },
        last: {
          rentcall:
            (emailStatus.rentcall &&
              emailStatus.rentcall.length &&
              emailStatus.rentcall[0]) ||
            undefined,
          rentcall_reminder:
            (emailStatus.rentcall_reminder &&
              emailStatus.rentcall_reminder.length &&
              emailStatus.rentcall_reminder[0]) ||
            undefined,
          rentcall_last_reminder:
            (emailStatus.rentcall_last_reminder &&
              emailStatus.rentcall_last_reminder.length &&
              emailStatus.rentcall_last_reminder[0]) ||
            undefined,
          invoice:
            (emailStatus.invoice &&
              emailStatus.invoice.length &&
              emailStatus.invoice[0]) ||
            undefined
        },
        count: {
          rentcall: (emailStatus.rentcall && emailStatus.rentcall.length) || 0,
          rentcall_reminder:
            (emailStatus.rentcall_reminder &&
              emailStatus.rentcall_reminder.length) ||
            0,
          rentcall_last_reminder:
            (emailStatus.rentcall_last_reminder &&
              emailStatus.rentcall_last_reminder.length) ||
            0,
          get allRentcall() {
            return (
              this.rentcall +
              this.rentcall_reminder +
              this.rentcall_last_reminder
            );
          },
          invoice: (emailStatus.invoice && emailStatus.invoice.length) || 0
        },
        ...emailStatus
      };

      // if (emailStatus.rentcall_reminder && emailStatus.rentcall_reminder.length) {
      //     const lastRentCallReminder = emailStatus.rentcall_reminder[0];
      //     if (computedEmailStatus.last.rentcall) {
      //         if (moment(computedEmailStatus.last.rentcall.sentDate).isBefore(moment(lastRentCallReminder.sentDate))){
      //             computedEmailStatus.last.rentcall = lastRentCallReminder;
      //         }
      //     } else {
      //         computedEmailStatus.last.rentcall = lastRentCallReminder;
      //     }
      // }

      Object.assign(rentToReturn, { emailStatus: computedEmailStatus });
    }

    const occupant = toOccupantData(inputOccupant);

    Object.assign(rentToReturn, {
      _id: occupant._id,
      occupant: occupant,
      vatRatio: occupant.vatRatio,
      uid: `${occupant._id}|${rent.month}|${rent.year}`
    });

    // count number of month rent not paid
    let endCounting = false;
    inputOccupant.rents
      .reverse()
      .filter((currentRent) => {
        if (
          moment(String(currentRent.term), 'YYYYMMDDHH').isSameOrBefore(
            moment(),
            'month'
          )
        ) {
          if (endCounting) {
            return false;
          }

          const { grandTotal, payment } = currentRent.total;
          const newBalance = payment - grandTotal;

          if (grandTotal <= 0 || newBalance >= 0) {
            endCounting = true;
            return false;
          }

          if (payment > 0) {
            endCounting = true;
          }

          return true;
        }
        return false;
      })
      .reverse()
      .forEach((currentRent) => {
        const payment = currentRent.total.payment;
        const term = moment(String(currentRent.term), 'YYYYMMDDHH');
        rentToReturn.paymentStatus.push({
          month: term.month() + 1,
          status: payment > 0 ? 'partiallypaid' : 'notpaid'
        });
        rentToReturn.countMonthNotPaid++;
      });
  }

  return rentToReturn;
}

export function toOccupantData(inputOccupant) {
  const occupant = JSON.parse(JSON.stringify(inputOccupant));

  // set default values for occupant
  Object.assign(occupant, {
    beginDate: moment(occupant.beginDate).format('DD/MM/YYYY'),
    endDate: moment(occupant.endDate).format('DD/MM/YYYY'),
    frequency: occupant.frequency || 'months',
    street1: occupant.street1 || '',
    street2: occupant.street2 || '',
    zipCode: occupant.zipCode || '',
    city: occupant.city || '',
    legalForm: occupant.legalForm || '',
    siret: occupant.siret || '',
    contract: occupant.contract || '',
    reference: occupant.reference || '',
    guaranty: occupant.guaranty ? Number(occupant.guaranty) : 0,
    vatRatio: occupant.vatRatio ? Number(occupant.vatRatio) : 0,
    discount: occupant.discount ? Number(occupant.discount) : 0,
    rental: 0,
    expenses: 0,
    total: 0
  });

  if (occupant.terminationDate) {
    occupant.terminationDate = moment(occupant.terminationDate).format(
      'DD/MM/YYYY'
    );
  }

  occupant.contactEmails =
    occupant.contacts && occupant.contacts.length
      ? occupant.contacts.reduce((acc, { email }) => {
          if (email) {
            return [...acc, email.toLowerCase()];
          }
          return acc;
        }, [])
      : [];

  occupant.hasContactEmails = occupant.contactEmails.length > 0;

  // Compute if contract is completed
  occupant.status = 'inprogress';
  occupant.terminated = false;
  const currentDate = moment();
  const endMoment = moment(
    occupant.terminationDate || occupant.endDate,
    'DD/MM/YYYY'
  );
  if (endMoment.isBefore(currentDate, 'day')) {
    occupant.terminated = true;
    occupant.status = 'stopped';
  }

  if (occupant.leaseId) {
    occupant.lease = occupant.leaseId;
    occupant.leaseId = occupant.leaseId._id;
  }

  if (occupant.properties) {
    occupant.office = {
      surface: 0,
      // m2Price: 0,
      // m2Expense: 0,
      price: 0
      // expense: 0,
    };
    occupant.parking = {
      price: 0
      // expense: 0,
    };
    occupant.properties.forEach((item) => {
      if (item.propertyId?._id) {
        item.property = item.property || item.propertyId;
        item.propertyId = item.propertyId._id;
      }
      if (item.property) {
        if (item.property.type === 'parking') {
          occupant.parking.price += item.property.price;
          // if (item.property.expense) {
          //   occupant.parking.expense += item.property.expense;
          // }
        } else {
          occupant.office.surface += item.property.surface;
          occupant.office.price += item.property.price;
          // if (item.property.expense) {
          //   occupant.office.expense += item.property.expense;
          // }
        }
      }
      occupant.rental += item.rent || 0;
      occupant.expenses +=
        (item.expenses?.length &&
          item.expenses.reduce((acc, { amount }) => acc + amount, 0)) ||
        0;
      if (item.entryDate) {
        item.entryDate = moment(item.entryDate).format('DD/MM/YYYY');
      }
      if (item.exitDate) {
        item.exitDate = moment(item.exitDate).format('DD/MM/YYYY');
      }
    });
    occupant.preTaxTotal =
      occupant.rental + occupant.expenses - occupant.discount;
    occupant.total = occupant.preTaxTotal;
    if (occupant.vatRatio) {
      occupant.vat = occupant.preTaxTotal * occupant.vatRatio;
      occupant.total = occupant.preTaxTotal + occupant.vat;
    }
    // if (occupant.office) {
    //   occupant.office.m2Price = occupant.office.price / occupant.office.surface;
    //   occupant.office.m2Expense =
    //     occupant.office.expense / occupant.office.surface;
    // }
  }

  occupant.hasPayments = occupant.rents
    ? occupant.rents.some(
        (rent) =>
          (rent.payments &&
            rent.payments.some((payment) => payment.amount > 0)) ||
          rent.discounts.some((discount) => discount.origin === 'settlement')
      )
    : false;
  delete occupant.rents;
  return occupant;
}

export function toProperty(inputProperty, inputOccupant, inputOccupants) {
  const currentDate = moment();
  let property = {
    _id: inputProperty._id,
    type: inputProperty.type,
    name: inputProperty.name,
    description: inputProperty.description,
    surface: inputProperty.surface,
    phone: inputProperty.phone,
    digicode: inputProperty.digicode,
    address: inputProperty.address,

    price: inputProperty.price,

    beginDate: '',
    endDate: '',
    lastBusyDay: '',
    occupantLabel: '',
    available: true,
    status: 'vacant',

    // TODO moved in Occupant.properties model
    // expense: inputProperty.expense || 0,
    // priceWithExpenses:
    //   Math.round((inputProperty.price + inputProperty.expense) * 100) / 100,
    // m2Expense: inputProperty.surface
    //   ? Math.round((inputProperty.expense / inputProperty.surface) * 100) / 100
    //   : null,
    // m2Price: inputProperty.surface
    //   ? Math.round((inputProperty.price / inputProperty.surface) * 100) / 100
    //   : null,

    // TODO to remove, replaced by address
    location: inputProperty.location
  };
  if (inputOccupant) {
    property = {
      ...property,
      beginDate: moment(inputOccupant.entryDate).format('DD/MM/YYYY'),
      endDate: moment(inputOccupant.exitDate).format('DD/MM/YYYY'),
      lastBusyDay: moment(
        inputOccupant.terminationDate || inputOccupant.endDate
      ).format('DD/MM/YYYY'),
      occupantLabel: inputOccupant.name
    };
    if (property.lastBusyDay) {
      property.available = moment(property.lastBusyDay, 'DD/MM/YYYY').isBefore(
        currentDate,
        'day'
      );
      if (!property.available) {
        property.status = 'occupied';
      }
    }
  }
  property.occupancyHistory = [];
  if (inputOccupants && inputOccupants.length) {
    property.occupancyHistory = inputOccupants.map((occupant) => {
      return {
        id: occupant._id,
        name: occupant.name,
        beginDate: moment(occupant.beginDate).format('DD/MM/YYYY'),
        endDate: moment(occupant.terminationDate || occupant.endDate).format(
          'DD/MM/YYYY'
        )
      };
    });
  }

  return property;
}
