import type { AccountType } from '@microrealestate/shared';
import * as bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';
import * as DateFormat from '../utils/dateformat';
import type { MongooseDocType } from './types';

const AccountSchema = new Schema<Omit<AccountType, '_id'>>({
  firstname: {
    type: String,
    trim: true,
    required: true
  },
  lastname: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
  password: {
    type: String,
    trim: true,
    required: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  createdDate: String
});

export type AccountDocType = MongooseDocType<AccountType>;

// lowercase email
// hash user password before saving into database
AccountSchema.pre('save', function (this: AccountDocType, next) {
  if (!this.createdDate) {
    this.createdDate = DateFormat.now();
  }
  this.email = this.email.toLowerCase();
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

export default model<AccountDocType>('Account', AccountSchema);
