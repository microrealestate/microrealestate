import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Property from './property.js';
import Realm from './realm.js';
import Utility from './utility.js';

const UtilityInvoiceSchema = new mongoose.Schema<CollectionTypes.UtilityInvoice>(
  {
    realmId: { type: String, ref: Realm, required: true, index: true },
    utilityId: { type: String, ref: Utility, required: true, index: true },
    propertyId: { type: String, ref: Property, required: true, index: true },
    occupantId: { type: String, required: true, index: true },
    occupantEmail: { type: String, required: true },
    billingMonth: { type: String, required: true, index: true },
    invoiceAmount: { type: Number, required: true },
    invoiceNumber: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'outstanding', 'paid', 'void'],
      default: 'draft',
      index: true
    },
    sentAt: { type: Date, default: null },
    sentBy: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    paidBy: { type: String, default: '' },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: String, default: '' },
    attachmentId: { type: String, default: '' },
    emailMessageId: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    paymentNotes: { type: String, default: '' },
    dueDate: { type: Date, default: null }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

UtilityInvoiceSchema.index({ realmId: 1, occupantId: 1, billingMonth: 1 });
UtilityInvoiceSchema.index({ realmId: 1, status: 1, billingMonth: -1 });
UtilityInvoiceSchema.index({ utilityId: 1, status: 1 });

export default mongoose.model<CollectionTypes.UtilityInvoice>(
  'UtilityInvoice',
  UtilityInvoiceSchema
);
