import { LEASE_TIME_RANGES, type LeaseType } from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import Realm from './realm';
import type { MongooseDocType } from './types';

const LeaseSchema = new Schema<Omit<LeaseType, '_id'>>({
  realmId: { type: String, ref: Realm, required: true },
  name: { type: String, required: true },
  description: String,
  numberOfTerms: Number,
  timeRange: {
    type: String,
    enum: [...LEASE_TIME_RANGES]
  },
  active: { type: Boolean, default: false },
  autoRenew: { type: Boolean, default: false },

  // ui state
  stepperMode: { type: Boolean, default: false }
});

export type LeaseDocType<Realm = string> = MongooseDocType<LeaseType<Realm>>;
export default model<LeaseDocType>('Lease', LeaseSchema);
