import type { EmailType } from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import type { MongooseDocType } from './types';

const EmailSchema = new Schema<Omit<EmailType, '_id'>>({
  templateName: { type: String, required: true },
  recordId: { type: String, required: true },
  params: {},
  sentTo: { type: String, required: true },
  sentDate: String
});

export type EmailDocType = MongooseDocType<EmailType>;
export default model<EmailDocType>('Email', EmailSchema);
