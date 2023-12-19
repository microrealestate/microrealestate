import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const TemplateSchema = new mongoose.Schema<CollectionTypes.Template>({
  realmId: { type: String, ref: Realm },
  name: String,
  type: String, // one of 'text', 'fileDescriptor'
  description: String,
  hasExpiryDate: Boolean,
  contents: Object,
  html: String,
  linkedResourceIds: Array,
  required: Boolean,
  requiredOnceContractTerminated: Boolean,
});

export default mongoose.model<CollectionTypes.Template>(
  'Template',
  TemplateSchema
);
