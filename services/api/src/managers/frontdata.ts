import { DateFormat } from '@microrealestate/common';
import type {
  API,
  LeaseType,
  PropertyType,
  Rent,
  TenantType
} from '@microrealestate/shared';
import moment from 'moment';

type RentEmailStatusMap = Record<
  string,
  API.Landlord.Rent.RentEmailSendRecord[] | undefined
>;

export function toRentData(
  inputRent: Rent,
  inputOccupant?: TenantType,
  emailStatus?: RentEmailStatusMap
): API.Landlord.Rent.RentViewData {
  const rent: Rent = JSON.parse(JSON.stringify(inputRent));
  const rentMoment = moment(String(rent.term), 'YYYYMMDDHH');

  const rentToReturn: API.Landlord.Rent.RentViewData = {
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
    paymentStatus: [],
    status: ''
  };

  const settlement = rent.discounts
    .filter((discount) => discount.origin === 'settlement')
    .reduce(
      (acc, discount) => ({
        promo: acc.promo + discount.amount,
        notepromo: `${acc.notepromo}${discount.description}\n`
      }),
      { promo: 0, notepromo: '' }
    );
  rentToReturn.promo = settlement.promo;
  rentToReturn.notepromo = settlement.notepromo;

  const debts = rent.debts.reduce(
    (acc, debt) => ({
      extracharge: acc.extracharge + debt.amount,
      noteextracharge: `${acc.noteextracharge}${debt.description}\n`
    }),
    { extracharge: 0, noteextracharge: '' }
  );
  rentToReturn.extracharge = debts.extracharge;
  rentToReturn.noteextracharge = debts.noteextracharge;

  // Get the first vat rate found in vats.
  const vatRate = rent.vats?.length
    ? (rent.vats.filter((vat) => vat.origin === 'contract')[0]?.rate ?? 0)
    : 0;
  if (vatRate) {
    if (rentToReturn.promo && rentToReturn.promo > 0) {
      rentToReturn.promo =
        Math.round(rentToReturn.promo * (1 + vatRate) * 100) / 100;
    }

    if (rentToReturn.extracharge && rentToReturn.extracharge > 0) {
      rentToReturn.extracharge =
        Math.round(rentToReturn.extracharge * (1 + vatRate) * 100) / 100;
    }
  }

  rentToReturn.totalWithoutVatAmount = rent.discounts
    .filter((discount) => discount.origin === 'contract')
    .reduce(
      (total, discount) => total - discount.amount,
      rent.total.preTaxAmount + rent.total.charges
    );

  rentToReturn.vatAmount = rent.vats
    .filter((vat) => vat.origin === 'contract')
    .reduce((total, vat) => total + vat.amount, 0);

  // payment status
  if (rentToReturn.totalAmount <= 0 || rentToReturn.newBalance >= 0) {
    rentToReturn.status = 'paid';
  } else if (rentToReturn.payment > 0) {
    rentToReturn.status = 'partiallypaid';
  } else if (rentMoment.isSameOrBefore(moment(), 'month')) {
    rentToReturn.status = 'notpaid';
  }

  if (inputOccupant) {
    // email status
    if (emailStatus) {
      const computedEmailStatus: API.Landlord.Rent.RentEmailStatusPayload = {
        status: {
          rentnotice: !!emailStatus.rentnotice?.length,
          rentnotice_reminder: !!emailStatus.rentnotice_reminder?.length,
          rentnotice_last_reminder:
            !!emailStatus.rentnotice_last_reminder?.length,
          receipt: !!emailStatus.receipt?.length
        },
        last: {
          rentnotice:
            (emailStatus.rentnotice?.length && emailStatus.rentnotice[0]) ||
            undefined,
          rentnotice_reminder:
            (emailStatus.rentnotice_reminder?.length &&
              emailStatus.rentnotice_reminder[0]) ||
            undefined,
          rentnotice_last_reminder:
            (emailStatus.rentnotice_last_reminder?.length &&
              emailStatus.rentnotice_last_reminder[0]) ||
            undefined,
          receipt:
            (emailStatus.receipt?.length && emailStatus.receipt[0]) || undefined
        },
        count: {
          rentnotice: emailStatus.rentnotice?.length || 0,
          rentnotice_reminder: emailStatus.rentnotice_reminder?.length || 0,
          rentnotice_last_reminder:
            emailStatus.rentnotice_last_reminder?.length || 0,
          get allRentnotice() {
            return (
              this.rentnotice +
              this.rentnotice_reminder +
              this.rentnotice_last_reminder
            );
          },
          receipt: emailStatus.receipt?.length || 0
        },
        ...emailStatus
      };

      rentToReturn.emailStatus = computedEmailStatus;
    }

    const occupant = toOccupantData(inputOccupant);

    rentToReturn._id = occupant._id;
    rentToReturn.occupant = occupant;
    rentToReturn.vatRatio = occupant.vatRatio;
    rentToReturn.uid = `${occupant._id}|${rentMoment.month() + 1}|${rentMoment.year()}`;

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

export function toOccupantData(
  inputOccupant: TenantType<string, string | LeaseType, string | PropertyType>
): API.Landlord.Tenant.OccupantData {
  const occupant = JSON.parse(JSON.stringify(inputOccupant));

  // set default values for occupant
  occupant.frequency = occupant.frequency || 'months';
  occupant.street1 = occupant.street1 || '';
  occupant.street2 = occupant.street2 || '';
  occupant.zipCode = occupant.zipCode || '';
  occupant.city = occupant.city || '';
  occupant.country = occupant.country || '';
  occupant.legalForm = occupant.legalForm || '';
  occupant.siret = occupant.siret || '';
  occupant.contract = occupant.contract || '';
  occupant.reference = occupant.reference || '';
  occupant.expectedSecurityDeposit = occupant.expectedSecurityDeposit
    ? Number(occupant.expectedSecurityDeposit)
    : 0;
  occupant.securityDeposit = Array.isArray(occupant.securityDeposit)
    ? occupant.securityDeposit
    : [];
  occupant.securityDepositRefund = Array.isArray(occupant.securityDepositRefund)
    ? occupant.securityDepositRefund
    : [];
  occupant.vatRatio = occupant.vatRatio ? Number(occupant.vatRatio) : 0;
  occupant.discount = occupant.discount ? Number(occupant.discount) : 0;
  occupant.rental = 0;
  occupant.expenses = 0;
  occupant.total = 0;

  occupant.contactEmails = occupant.contacts?.length
    ? occupant.contacts.reduce(
        (acc: string[], { email }: { email: string }) => {
          if (email) {
            acc.push(email.toLowerCase());
          }
          return acc;
        },
        []
      )
    : [];

  occupant.hasContactEmails = occupant.contactEmails.length > 0;

  // Compute if contract is completed
  occupant.status = 'inprogress';
  occupant.terminated = false;
  const currentDate = moment();
  const endMoment = moment(
    occupant.terminationDate || occupant.endDate,
    DateFormat.DATE_FORMAT
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
      price: 0
    };
    occupant.parking = {
      price: 0
    };
    occupant.properties.forEach(
      (item: {
        propertyId: { _id: string } | string;
        property: PropertyType;
        rent: number;
        expenses: {
          title: string;
          amount: number;
          beginDate?: string;
          endDate?: string;
        }[];
        entryDate: string;
        exitDate?: string;
      }) => {
        if (
          typeof item.propertyId === 'object' &&
          item.propertyId !== null &&
          '_id' in item.propertyId
        ) {
          item.property =
            item.property || (item.propertyId as unknown as PropertyType);
          item.propertyId = (item.propertyId as { _id: string })._id;
        }
        if (item.property) {
          item.expenses.forEach(
            (expense: { beginDate?: string; endDate?: string }) => {
              expense.beginDate = expense.beginDate || item.entryDate;
              expense.endDate = expense.endDate || item.exitDate;
            }
          );
          if (item.property.type === 'parking') {
            occupant.parking.price += item.property.price;
          } else {
            occupant.office.surface += item.property.surface;
            occupant.office.price += item.property.price;
          }
        }
        occupant.rental += item.rent || 0;
        occupant.expenses +=
          (item.expenses?.length &&
            item.expenses.reduce(
              (acc: number, { amount }: { amount: number }) => acc + amount,
              0
            )) ||
          0;
      }
    );
    occupant.preTaxTotal =
      occupant.rental + occupant.expenses - occupant.discount;
    occupant.total = occupant.preTaxTotal;
    if (occupant.vatRatio) {
      occupant.vat = occupant.preTaxTotal * occupant.vatRatio;
      occupant.total = occupant.preTaxTotal + occupant.vat;
    }
  }

  occupant.hasPayments = occupant.rents
    ? occupant.rents.some(
        (rent: Rent) =>
          rent.payments?.some((payment) => payment.amount > 0) ||
          rent.discounts.some((discount) => discount.origin === 'settlement')
      )
    : false;
  delete occupant.rents;
  return occupant;
}

export function toProperty(
  inputProperty: PropertyType,
  inputOccupant?: TenantType<string, string | LeaseType, string | PropertyType>,
  inputOccupants?: TenantType<
    string,
    string | LeaseType,
    string | PropertyType
  >[]
): API.Landlord.Property.PropertyWithOccupancyData {
  const currentDate = moment();
  const property: API.Landlord.Property.PropertyWithOccupancyData = {
    _id: inputProperty._id,
    type: inputProperty.type,
    name: inputProperty.name,
    description: inputProperty.description,
    surface: inputProperty.surface,
    phone: inputProperty.phone,
    digicode: inputProperty.digicode,
    address: inputProperty.address,

    price: inputProperty.price,

    beginDate: undefined,
    endDate: undefined,
    lastBusyDay: undefined,
    occupantLabel: '',
    available: true,
    status: 'vacant',

    occupancyHistory: [],

    // TODO to remove, replaced by address
    location: inputProperty.location,
    stepperMode: inputProperty.stepperMode ?? false
  };
  if (inputOccupant) {
    property.beginDate = inputOccupant.beginDate;
    property.endDate = inputOccupant.endDate;
    property.lastBusyDay =
      inputOccupant.terminationDate || inputOccupant.endDate;
    property.occupantLabel = inputOccupant.name;
    if (property.lastBusyDay) {
      property.available = moment(
        property.lastBusyDay,
        DateFormat.DATE_FORMAT
      ).isBefore(currentDate, 'day');
      if (!property.available) {
        property.status = 'occupied';
      }
    }
  }
  if (inputOccupants?.length) {
    property.occupancyHistory = inputOccupants.reduce<
      { id: string; name: string; beginDate: string; endDate: string }[]
    >((acc, occupant) => {
      const endDate = occupant.terminationDate || occupant.endDate;
      if (occupant.beginDate && endDate) {
        acc.push({
          id: occupant._id,
          name: occupant.name,
          beginDate: occupant.beginDate,
          endDate: endDate
        });
      }
      return acc;
    }, []);
  }

  return property;
}
