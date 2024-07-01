import * as bcrypt from 'bcrypt';
import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';

const RealmSchema = new mongoose.Schema<CollectionTypes.Realm>({
  name: String,
  members: [
    {
      name: String,
      email: String,
      role: String,
      registered: Boolean,
    },
  ],
  applications: [
    {
      name: String,
      role: String,
      clientId: String,
      clientSecret: String,
      createdDate: Date,
      expiryDate: Date,
    },
  ],
  addresses: [
    {
      street1: String,
      street2: String,
      zipCode: String,
      city: String,
      state: String,
      country: String,
    },
  ],
  bankInfo: {
    name: String,
    iban: String,
  },
  contacts: [
    {
      name: String,
      email: String,
      phone1: String,
      phone2: String,
    },
  ],
  isCompany: Boolean,
  companyInfo: {
    name: String,
    legalStructure: String,
    legalRepresentative: String,
    capital: Number,
    ein: String,
    dos: String,
    vatNumber: String,
  },
  thirdParties: {
    gmail: {
      selected: Boolean,
      email: String,
      appPassword: String,
      fromEmail: String,
      replyToEmail: String,
    },
    smtp: {
      selected: Boolean,
      server: String,
      port: Number,
      secure: Boolean,
      authentication: Boolean,
      username: String,
      password: String,
      fromEmail: String,
      replyToEmail: String,
    },
    mailgun: {
      selected: Boolean,
      apiKey: String,
      domain: String,
      fromEmail: String,
      replyToEmail: String,
    },
    b2: {
      keyId: String,
      applicationKey: String,
      endpoint: String,
      bucket: String,
    },
  },
  locale: String,
  currency: String,
});
//
// hash application secrets before saving into database
RealmSchema.pre('save', function (next) {
  for (const app of this.applications) {
    // chick if first save to hash secret
    if (!app.createdDate) {
      app.createdDate = new Date();
      app.clientSecret = bcrypt.hashSync(app.clientSecret, 10);
    }
  }
  next();
});

export default mongoose.model<CollectionTypes.Realm>('Realm', RealmSchema);
