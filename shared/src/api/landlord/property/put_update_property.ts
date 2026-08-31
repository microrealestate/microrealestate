import type { PropertyType } from '../../../entities/property';
import type { PropertyWithOccupancyData } from './types';

export type RequestParams = Record<string, never>;
export type RequestBody = Omit<PropertyType, 'realmId'>;
export type ResponseBody = PropertyWithOccupancyData;
