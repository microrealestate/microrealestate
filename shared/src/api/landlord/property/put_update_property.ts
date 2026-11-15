import type { PropertyType } from '../../../entities/property';
import type { PropertyWithOccupancyData } from './types';

export type RequestParams = { id: string };
// `parentId: null` unlinks the unit from its parent
export type RequestBody = Omit<PropertyType, 'realmId' | 'parentId'> & {
  parentId?: string | null;
};
export type ResponseBody = PropertyWithOccupancyData;
