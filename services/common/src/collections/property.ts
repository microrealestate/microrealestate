import type { PropertyType } from '@microrealestate/shared';
import { PROPERTY_KINDS } from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import Realm from './realm';
import type { MongooseDocType } from './types';

export const PropertySchema = new Schema<Omit<PropertyType, '_id'>>({
  realmId: { type: String, ref: Realm, required: true },
  type: { type: String, enum: [...PROPERTY_KINDS] },
  name: { type: String, required: true },
  description: String,
  surface: Number,
  notes: String,
  customFields: {
    type: [
      {
        _id: false,
        label: { type: String, required: true },
        value: { type: String, default: '' }
      }
    ],
    default: undefined
  },
  address: {
    _id: false,
    street1: String,
    street2: String,
    zipCode: String,
    city: String,
    state: String,
    country: String
  },
  price: { type: Number, default: 0 },

  parentId: { type: String, ref: 'Property' },
  availableForRent: { type: Boolean, required: true },

  // ui state
  stepperMode: { type: Boolean, default: false }
});

export type PropertyDocType<Realm = string> = MongooseDocType<
  PropertyType<Realm>
>;

export default model<PropertyDocType>('Property', PropertySchema);
