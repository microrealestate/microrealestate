import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const LeaseSchema = new mongoose.Schema<CollectionTypes.Lease>(
  {
    realmId: { type: String, ref: Realm },
    name: String,
    description: String,
    numberOfTerms: Number,
    timeRange: { type: String, enum: ['days', 'weeks', 'months', 'years'] },
    active: Boolean,

    // ui state
    stepperMode: { type: Boolean, default: false },

    lastUpdatedBy: { type: String, default: '' }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

export default mongoose.model<CollectionTypes.Lease>('Lease', LeaseSchema);
