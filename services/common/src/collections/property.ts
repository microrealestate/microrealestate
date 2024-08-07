import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const PropertySchema = new mongoose.Schema<CollectionTypes.Property>({
  realmId: { type: String, ref: Realm },

  type: String,
  name: String,
  description: String,
  surface: Number,
  phone: String,
  digicode: String,
  address: {
    _id: false,
    street1: String,
    street2: String,
    zipCode: String,
    city: String,
    state: String,
    country: String
  },

  price: Number
});
export default mongoose.model<CollectionTypes.Property>(
  'Property',
  PropertySchema
);
