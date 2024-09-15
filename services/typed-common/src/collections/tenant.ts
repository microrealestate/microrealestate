import { CollectionTypes } from '@microrealestate/types';
import Lease from './lease.js';
import mongoose from 'mongoose';
import Property from './property.js';
import Realm from './realm.js';

const TenantSchema = new mongoose.Schema<CollectionTypes.Tenant>({
  // Organization
  realmId: { type: String, ref: Realm },

  // individual details
  name: String,

  // company details
  isCompany: Boolean,
  company: String,
  manager: String,
  legalForm: String,
  siret: String,
  rcs: String,
  capital: Number,

  // address
  street1: String,
  street2: String,
  zipCode: String,
  city: String,

  // contacts
  contacts: [
    {
      contact: String,
      phone: String,
      email: String
    }
  ],

  // contract
  reference: String,
  contract: String,
  leaseId: { type: String, ref: Lease },
  beginDate: Date,
  endDate: Date,
  terminationDate: Date,
  properties: [
    {
      _id: false,
      propertyId: { type: String, ref: Property },
      property: Property.schema,
      rent: Number,
      expenses: [{ _id: false, title: String, amount: Number }],
      entryDate: Date,
      exitDate: Date
    }
  ],
  // rents: [
  //   {
  //     term: Number,
  //     preTaxAmounts: [
  //       {
  //         amount: Number,
  //         description: String
  //       }
  //     ],
  //     charges: [
  //       {
  //         amount: Number,
  //         description: String
  //       }
  //     ],
  //     debts: [
  //       {
  //         amount: Number,
  //         description: String
  //       }
  //     ],
  //     discounts: [
  //       {
  //         origin: String,
  //         amount: Number,
  //         description: String
  //       }
  //     ],
  //     vats: [
  //       {
  //         origin: String,
  //         amount: Number,
  //         description: String,
  //         rate: Number
  //       }
  //     ],
  //     payments: [
  //       {
  //         date: Date,
  //         type: String,
  //         reference: String,
  //         amount: Number
  //       }
  //     ],
  //     total: {
  //       preTaxAmount: Number,
  //       charges: Number,
  //       vat: Number,
  //       discount: Number,
  //       debts: Number,
  //       balance: Number,
  //       grandTotal: Number,
  //       payment: Number
  //     }
  //   }
  // ],
  rents: {},

  // billing
  isVat: Boolean,
  vatRatio: Number,
  discount: Number,
  guaranty: Number,
  guarantyPayback: Number,

  // ui state
  stepperMode: { type: Boolean, default: false }
});

export default mongoose.model<CollectionTypes.Tenant>('Occupant', TenantSchema);
