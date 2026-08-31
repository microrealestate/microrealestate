import type { TemplateType } from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import Lease from './lease';
import Realm from './realm';
import type { MongooseDocType } from './types';

const TemplateSchema = new Schema<Omit<TemplateType, '_id'>>({
  realmId: { type: String, ref: Realm },
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'fileDescriptor'] },
  description: String,
  hasExpiryDate: { type: Boolean, default: false },
  contents: Object,
  html: String,
  relatesTo: [{ type: String, ref: Lease, required: true }],
  required: { type: Boolean, default: false },
  requiredOnceContractTerminated: { type: Boolean, default: false }
});

export type TemplateDocType<Realm = string, Lease = string> = MongooseDocType<
  TemplateType<Realm, Lease>
>;

export default model<TemplateDocType>('Template', TemplateSchema);
