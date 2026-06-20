import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Property from './property.js';
import Realm from './realm.js';

const UtilitySplitSchema = new mongoose.Schema<CollectionTypes.UtilitySplit>(
  {
    subPropertyId: { type: String, ref: Property, required: true },
    splitType: {
      type: String,
      enum: ['percentage', 'equal'],
      required: true
    },
    percentage: { type: Number, default: null }
  },
  { _id: false }
);

const UtilitySchema = new mongoose.Schema<CollectionTypes.Utility>(
  {
    realmId: { type: String, ref: Realm, required: true, index: true },
    propertyId: { type: String, ref: Property, required: true, index: true },
    type: {
      type: String,
      required: true,
      index: true
    },
    provider: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    billingMonth: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, default: null },
    paidDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    attachmentIds: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['confirmed', 'pending'],
      default: 'confirmed',
      index: true
    },
    source: {
      type: String,
      enum: ['manual', 'email'],
      default: 'manual',
      index: true
    },
    confirmationNumber: { type: String, default: '', index: true },
    emailMessageId: { type: String, default: '', index: true },
    importIssues: { type: [String], default: [] },
    splitMethod: {
      type: String,
      enum: ['equal', 'percentage'],
      default: 'equal'
    },
    splitItems: { type: [UtilitySplitSchema], default: [] },
    originalAmount: { type: Number, default: null },
    splitTotal: { type: Number, default: null },
    sourceUtilityId: { type: String, default: '' },
    invoicedAt: { type: Date, default: null },
    invoicedBy: { type: String, default: '' },
    billEnteredAt: { type: Date, default: Date.now },
    billEnteredBy: { type: String, default: '' },
    lastUpdatedBy: { type: String, default: '' }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

UtilitySchema.index({ propertyId: 1, billingMonth: -1, type: 1 });

export default mongoose.model<CollectionTypes.Utility>(
  'Utility',
  UtilitySchema
);
