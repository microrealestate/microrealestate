import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';
import Utility from './utility.js';

const UtilityActivityDetailsSchema = new mongoose.Schema(
  {
    splitMethod: { type: String, enum: ['equal', 'percentage', null], default: null },
    splitCount: { type: Number, default: null },
    qbPostedAt: { type: Date, default: null },
    qbReference: { type: String, default: '' },
    invoiceIds: { type: [String], default: [] },
    invoiceId: { type: String, default: '' },
    paidAmount: { type: Number, default: null },
    paymentMethod: { type: String, default: '' },
    paymentReference: { type: String, default: '' }
  },
  { _id: false }
);

const UtilityActivitySchema = new mongoose.Schema<CollectionTypes.UtilityActivity>(
  {
    realmId: { type: String, ref: Realm, required: true, index: true },
    utilityId: { type: String, ref: Utility, required: true, index: true },
    eventType: {
      type: String,
      enum: ['split_created', 'qb_posted', 'invoiced', 'invoice_sent', 'payment_received'],
      required: true,
      index: true
    },
    actor: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    details: { type: UtilityActivityDetailsSchema, default: {} },
    notes: { type: String, default: '' }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

UtilityActivitySchema.index({ realmId: 1, utilityId: 1, timestamp: -1 });
UtilityActivitySchema.index({ realmId: 1, eventType: 1, timestamp: -1 });

export default mongoose.model<CollectionTypes.UtilityActivity>(
  'UtilityActivity',
  UtilityActivitySchema
);
