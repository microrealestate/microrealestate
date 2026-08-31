import type { Address } from '../common';

export const PROPERTY_KINDS = [
  'store',
  'building',
  'apartment',
  'room',
  'office',
  'garage',
  'parking',
  'letterbox'
] as const;
export type PropertyKind = (typeof PROPERTY_KINDS)[number];

export type PropertyStatus = 'vacant' | 'occupied';

export const PROPERTY_COUNT_WARN_THRESHOLD = 5;

export interface PropertyType<Realm = string> {
  _id: string;
  realmId: Realm;
  type?: PropertyKind;
  name: string;
  description?: string;
  surface?: number;
  phone?: string;
  digicode?: string;
  address?: Address;
  price: number;
  /** @deprecated use `address` instead */
  location?: string;
  stepperMode?: boolean;
}
