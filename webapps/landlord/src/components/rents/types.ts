import type { API } from '@microrealestate/shared';
import type { RentSort, RentSortKey } from './rentView';

export type MonthRent = API.Landlord.Rent.RentViewData & {
  _id: string;
  occupant: API.Landlord.Tenant.OccupantData & { hasContactEmails: boolean };
};

export type MonthRents = {
  overview: API.Landlord.Rent.RentMonthOverview;
  rents: MonthRent[];
};

export type RentTableViewProps = {
  rents: MonthRent[];
  onDetails: (rent: MonthRent) => void;
  selectableIds: string[];
  canSelect: boolean;
  sort: RentSort;
  onSort: (key: RentSortKey) => void;
};
