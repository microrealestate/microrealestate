import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';

const WarrantySchema = new mongoose.Schema<CollectionTypes.Warranty>({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  amount: Number,
  provider: String,
  type: String
});

export default mongoose.model<CollectionTypes.Warranty>('Warranty', WarrantySchema);