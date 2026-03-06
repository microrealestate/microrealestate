import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const ContractorSchema = new mongoose.Schema<CollectionTypes.Contractor>({
  // Organization
  realmId: { type: String, ref: Realm },

  // Company/Individual details
  name: { type: String, required: true },
  isCompany: { type: Boolean, default: false },
  company: String,
  manager: String,
  legalForm: String,
  siret: String,
  rcs: String,
  capital: Number,

  // Address
  street1: String,
  street2: String,
  zipCode: String,
  city: String,
  country: String,

  // Contact information
  contacts: [
    {
      _id: false,
      contact: String,
      phone: String,
      email: String
    }
  ],

  // Professional details
  businessType: String, // e.g., "Plumber", "Electrician", "Painter", etc.
  insurance: String, // Insurance certificate/number
  licenseNumber: String,
  taxId: String,

  // Notes and metadata
  notes: String,
  active: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5 },

  // Timestamps
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
});

ContractorSchema.index({ realmId: 1, name: 1 });
ContractorSchema.index({ realmId: 1, active: 1 });

export default mongoose.model<CollectionTypes.Contractor>(
  'Contractor',
  ContractorSchema
);
