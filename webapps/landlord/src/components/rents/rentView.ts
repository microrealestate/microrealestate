import type { MonthRent } from './types';

export type RentSortKey = 'tenant' | 'left' | 'status';
export type RentSort = { key: RentSortKey; direction: 1 | -1 };

export const DEFAULT_RENT_SORT: RentSort = { key: 'left', direction: -1 };

export function leftToPay(rent: MonthRent) {
  return -rent.newBalance;
}

export function isCredit(rent: MonthRent) {
  return leftToPay(rent) < 0;
}

export function paidPercent(rent: MonthRent) {
  if (rent.totalAmount <= 0) {
    return 100;
  }
  return Math.min(100, Math.round((rent.payment / rent.totalAmount) * 100));
}

export const RENT_STATUSES = [
  'notpaid',
  'partiallypaid',
  'upcoming',
  'paid'
] as const;
export type RentStatusValue = (typeof RENT_STATUSES)[number];

export function rentStatus(rent: MonthRent): RentStatusValue {
  if (
    rent.status === 'paid' ||
    rent.status === 'partiallypaid' ||
    rent.status === 'notpaid'
  ) {
    return rent.status;
  }
  // The API leaves a future month not paid yet without a status
  return 'upcoming';
}

const STATUS_ORDER: Record<RentStatusValue, number> = {
  notpaid: 0,
  partiallypaid: 1,
  upcoming: 2,
  paid: 3
};

export function sortRents(rents: MonthRent[], { key, direction }: RentSort) {
  const value = (rent: MonthRent): string | number => {
    switch (key) {
      case 'tenant':
        return (rent.occupant.name ?? '').toLowerCase();
      case 'status':
        return STATUS_ORDER[rentStatus(rent)];
      default:
        return leftToPay(rent);
    }
  };
  return [...rents].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === vb) {
      return 0;
    }
    return (va > vb ? 1 : -1) * direction;
  });
}

export function rentPropertyList(
  rent: MonthRent
): { id: string; name: string }[] {
  return (rent.occupant.properties ?? [])
    .filter(({ property }) => !!property?.name)
    .map(({ propertyId, property }) => ({
      id: String(propertyId),
      name: property.name
    }));
}

export function rentKey(rent: Pick<MonthRent, '_id' | 'term'>) {
  return `${rent._id}_${rent.term}`;
}
