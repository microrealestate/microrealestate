import type { PropertyStatus, PropertyType } from '../../../entities/property';

export type PropertyWithOccupancyData = Omit<PropertyType, 'realmId'> & {
  location?: string; // deprecated field, preserved for backwards compatibility
  beginDate?: string;
  endDate?: string;
  lastBusyDay?: string;
  occupantLabel: string;
  available: boolean;
  status: PropertyStatus;
  occupancyHistory: {
    id: string;
    name: string;
    beginDate: string;
    endDate: string;
  }[];
};
