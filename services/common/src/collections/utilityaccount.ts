import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Property from './property.js';
import Realm from './realm.js';

const UtilityAccountAllocationSchema =
  new mongoose.Schema<CollectionTypes.UtilityAccountAllocation>(
    {
      propertyId: { type: String, ref: Property, required: true },
      percentage: { type: Number, required: true }
    },
    { _id: false }
  );

const UtilityAccountSchema =
  new mongoose.Schema<CollectionTypes.UtilityAccount>(
    {
      realmId: { type: String, ref: Realm, required: true, index: true },
      type: {
        type: String,
        required: true,
        index: true
      },
      provider: { type: String, default: '' },
      accountNumber: {
        type: String,
        required: true,
        index: true,
        trim: true
      },
      notes: { type: String, default: '' },
      allocations: { type: [UtilityAccountAllocationSchema], default: [] }
    },
    {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
  );

UtilityAccountSchema.index({ realmId: 1, accountNumber: 1 }, { unique: true });

export default mongoose.model<CollectionTypes.UtilityAccount>(
  'UtilityAccount',
  UtilityAccountSchema
);
