import {
  EMAIL_NAMES,
  EMAIL_STATUSES,
  type EmailType
} from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import Realm from './realm';
import type { MongooseDocType } from './types';

const EmailSchema = new Schema<Omit<EmailType, '_id'>>({
  // realmId is optional for the public emails (otp, reset_password)
  realmId: { type: String, ref: Realm },
  templateName: { type: String, enum: [...EMAIL_NAMES], required: true },
  recordId: { type: String, required: true },
  params: {},
  sentTo: { type: [String], required: true },
  status: { type: String, enum: [...EMAIL_STATUSES] },
  error: { type: String },
  sentDate: String,
  emailId: String
});

export type EmailDocType<Realm = string> = MongooseDocType<EmailType<Realm>>;
export default model<EmailDocType>('Email', EmailSchema);
