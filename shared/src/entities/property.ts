import type { Address } from '../common';

export const PROPERTY_KINDS = [
  'store',
  'building',
  'apartment',
  'room',
  'office',
  'garage',
  'parking',
  'letterbox',
  'floor',
  'cellar',
  'estate'
] as const;
export type PropertyKind = (typeof PROPERTY_KINDS)[number];

export type PropertyStatus = 'vacant' | 'occupied';

export const PROPERTY_COUNT_WARN_THRESHOLD = 5;

export interface PropertyCustomField {
  label: string;
  value: string;
}

export const PROPERTY_KIND_CHILDREN: Readonly<
  Record<PropertyKind, readonly PropertyKind[]>
> = {
  estate: [
    'building',
    'store',
    'apartment',
    'office',
    'garage',
    'parking',
    'letterbox',
    'room',
    'cellar'
  ],
  building: [
    'floor',
    'store',
    'apartment',
    'office',
    'garage',
    'parking',
    'letterbox',
    'room',
    'cellar'
  ],
  floor: [
    'apartment',
    'office',
    'garage',
    'parking',
    'store',
    'letterbox',
    'room',
    'cellar'
  ],
  store: ['room', 'cellar'],
  apartment: ['room', 'cellar'],
  office: ['room', 'cellar'],
  garage: ['parking'],
  room: [],
  parking: [],
  letterbox: [],
  cellar: []
};

export interface PropertyType<Realm = string> {
  _id: string;
  realmId: Realm;
  type?: PropertyKind;
  name: string;
  description?: string;
  surface?: number;
  notes?: string;
  customFields?: PropertyCustomField[];
  address?: Address;
  price: number;
  stepperMode?: boolean;
  parentId?: string;
  availableForRent: boolean;
}
