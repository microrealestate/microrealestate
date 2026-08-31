import type { DocumentType } from '@microrealestate/shared';
import { model, type Query, Schema } from 'mongoose';
import * as DateFormat from '../utils/dateformat';
import Lease from './lease';
import Realm from './realm';
import Template from './template';
import Tenant from './tenant';
import type { MongooseDocType } from './types';

const DocumentSchema = new Schema<Omit<DocumentType, '_id'>>({
  realmId: { type: String, ref: Realm, required: true },
  relatesTo: {
    template: { type: String, ref: Template },
    tenants: [{ type: String, ref: Tenant }],
    leases: [{ type: String, ref: Lease }]
  },
  type: { type: String, enum: ['text', 'file'], required: true },
  name: { type: String, required: true },
  description: String,
  mimeType: String, // used only when type === "file"
  expiryDate: String, // used only when type === "file"
  contents: Object, // used only when type === "text"
  html: String, // used only when type === "text"
  url: String, // used only when type === "file"
  folder: String,
  createdDate: String,
  updatedDate: String,
  deletedAt: String
});

export type DocumentDocType<
  Realm = string,
  Template = string,
  Tenant = string,
  Lease = string
> = MongooseDocType<DocumentType<Realm, Template, Tenant, Lease>>;

DocumentSchema.pre('save', function (this: DocumentDocType, next) {
  const now = DateFormat.now();
  if (!this.createdDate) {
    this.createdDate = now;
  }
  this.updatedDate = now;
  next();
});

DocumentSchema.pre('findOneAndUpdate', function (next) {
  const update = this?.getUpdate();
  if (!(update && '$set' in update)) {
    return next();
  }

  update.$set = update.$set || {};
  update.$set.updatedDate = DateFormat.now();
  next();
});

function excludeDeleted(this: Query<unknown, unknown>, next: () => void) {
  const options = this.getOptions() as Record<string, unknown>;
  const filter = this.getFilter();
  if (options.includeDeleted || 'deletedAt' in filter) {
    return next();
  }
  this.where({ deletedAt: null });
  next();
}

DocumentSchema.pre(/^find/, excludeDeleted);
DocumentSchema.pre('countDocuments', excludeDeleted);

export default model<DocumentDocType>('Document', DocumentSchema);
