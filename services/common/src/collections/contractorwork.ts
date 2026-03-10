import { CollectionTypes } from '@microrealestate/types';
import Contractor from './contractor.js';
import mongoose from 'mongoose';
import Property from './property.js';
import Realm from './realm.js';

// Contractor work schema for tracking maintenance and project work
const ContractorWorkSchema = new mongoose.Schema<
  CollectionTypes.ContractorWork & { projectId?: string }
>({
  // Organization
  realmId: { type: String, ref: Realm },

  // References
  contractorId: { type: String, ref: Contractor, required: true },
  propertyId: { type: String, ref: Property },
  projectId: { type: String, ref: 'Project' },

  // Work details
  title: { type: String, required: true },
  description: String,
  workType: String, // e.g., "Maintenance", "Repair", "Inspection", "Renovation"
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Dates
  startDate: { type: Date, required: true },
  completionDate: Date,
  dueDate: Date,

  // Financial details
  estimatedCost: Number,
  actualCost: Number,
  currency: { type: String, default: 'EUR' },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paidDate: Date,

  // Documents
  receiptUrl: String,
  receiptFileName: String,
  bidUrl: String,
  bidFileName: String,
  invoiceUrl: String,
  invoiceFileName: String,

  // Additional attachments
  attachments: [
    {
      _id: false,
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: String
    }
  ],

  // Notes
  notes: String,
  internalNotes: String,

  // Timestamps
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
});

ContractorWorkSchema.index({ realmId: 1, contractorId: 1 });
ContractorWorkSchema.index({ realmId: 1, propertyId: 1 });
ContractorWorkSchema.index({ realmId: 1, projectId: 1 });
ContractorWorkSchema.index({ realmId: 1, status: 1 });
ContractorWorkSchema.index({ realmId: 1, startDate: 1 });

export default mongoose.model<CollectionTypes.ContractorWork>(
  'ContractorWork',
  ContractorWorkSchema
);
