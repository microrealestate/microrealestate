import mongoose from 'mongoose';
import Realm from './realm.js';
import { CollectionTypes } from '@microrealestate/types';

const LeaseSchema = new mongoose.Schema<CollectionTypes.Lease>({
  realmId: { type: String, ref: Realm },
  name: String,
  description: String,
  numberOfTerms: Number,
  timeRange: String, // days, weeks, months, years
  active: Boolean,

  // ui state
  stepperMode: { type: Boolean, default: false },
});

export default mongoose.model<CollectionTypes.Lease>('Lease', LeaseSchema);
