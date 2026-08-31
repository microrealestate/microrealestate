import {
  LOCALES,
  type RealmType,
  SMTP_ENCRYPTIONS
} from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import type { MongooseDocType } from './types';

const MemberSchema = {
  name: { type: String, default: '' },
  email: { type: String, required: true }
};

const RealmSchema = new Schema<Omit<RealmType, '_id'>>({
  name: { type: String, required: true },
  member1: { type: MemberSchema, required: true },
  member2: { type: MemberSchema, default: null },
  addresses: {
    type: [
      {
        street1: { type: String, required: true },
        street2: String,
        zipCode: String,
        city: { type: String, required: true },
        state: String,
        country: String
      }
    ],
    default: []
  },
  bankInfo: {
    name: { type: String, default: '' },
    iban: { type: String, default: '' }
  },
  contacts: {
    type: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone1: { type: String, required: true },
        phone2: String
      }
    ],
    default: []
  },
  isCompany: Boolean,
  companyInfo: {
    type: {
      name: { type: String, required: true },
      legalStructure: String,
      legalRepresentative: String,
      capital: Number,
      ein: String,
      dos: String,
      vatNumber: String
    },
    default: null
  },
  thirdParties: {
    type: {
      smtp: {
        server: String,
        port: Number,
        encryption: { type: String, enum: [...SMTP_ENCRYPTIONS] },
        authentication: Boolean,
        username: String,
        password: String,
        fromEmail: String,
        replyToEmail: String
      }
    },
    default: {}
  },
  locale: {
    type: String,
    enum: [...LOCALES],
    default: 'en'
  },
  currency: { type: String, required: true },
  webServer: {
    type: {
      domain: String,
      acmeEmail: String,
      httpsEnabled: { type: Boolean, default: false },
      ipAccessEnabled: { type: Boolean, default: true }
    },
    default: null
  }
});

export type RealmDocType = MongooseDocType<RealmType>;
export default model<RealmDocType>('Realm', RealmSchema);
