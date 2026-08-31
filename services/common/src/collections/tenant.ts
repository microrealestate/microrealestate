import { PAYMENT_METHODS, type TenantType } from '@microrealestate/shared';
import { model, Schema } from 'mongoose';
import Lease from './lease';
import Property, { PropertySchema } from './property';
import Realm from './realm';
import type { MongooseDocType } from './types';

const TenantSchema = new Schema<Omit<TenantType, '_id'>>({
  // Organization
  realmId: { type: String, ref: Realm, required: true },

  // individual details
  name: { type: String, required: true },

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
  state: String,
  country: String,

  // contacts
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

  // contract
  reference: { type: String, required: true },
  contract: String, //TODO remove contract, now leaseId is sufficient
  leaseId: { type: String, ref: Lease },
  beginDate: String,
  endDate: String,
  terminationDate: String,
  lastRenewedAt: String,
  renewalCount: { type: Number, default: 0 },
  properties: {
    type: [
      {
        _id: false,
        // TODO remove propertyId as ref of Property to keep it as a string
        propertyId: { type: String, ref: Property, required: true },
        property: { type: PropertySchema, required: true },
        rent: { type: Number, required: true },
        expenses: {
          type: [
            {
              _id: false,
              title: { type: String, required: true },
              amount: { type: Number, required: true },
              beginDate: { type: String, required: true },
              endDate: String
            }
          ],
          default: []
        },
        entryDate: { type: String, required: true },
        exitDate: String
      }
    ],
    default: []
  },
  rents: {
    type: [
      {
        term: { type: Number, required: true },
        preTaxAmounts: {
          type: [
            {
              amount: { type: Number, required: true },
              description: String
            }
          ],
          default: []
        },
        charges: {
          type: [
            {
              amount: { type: Number, required: true },
              description: String
            }
          ],
          default: []
        },
        debts: {
          type: [
            {
              amount: { type: Number, required: true },
              description: String
            }
          ],
          default: []
        },
        discounts: {
          type: [
            {
              origin: { type: String, required: true },
              amount: { type: Number, required: true },
              description: String
            }
          ],
          default: []
        },
        vats: {
          type: [
            {
              origin: { type: String, required: true },
              amount: { type: Number, required: true },
              description: String,
              rate: { type: Number, required: true }
            }
          ],
          default: []
        },
        payments: {
          type: [
            {
              date: { type: String, required: true },
              type: {
                type: String,
                enum: [...PAYMENT_METHODS],
                required: true
              },
              reference: { type: String, required: true },
              amount: { type: Number, required: true }
            }
          ],
          default: []
        },
        total: {
          type: {
            preTaxAmount: { type: Number, required: true },
            charges: { type: Number, required: true },
            vat: { type: Number, required: true },
            discount: { type: Number, required: true },
            debts: { type: Number, required: true },
            balance: { type: Number, required: true },
            grandTotal: { type: Number, required: true },
            payment: { type: Number, required: true }
          },
          default: {
            preTaxAmount: 0,
            charges: 0,
            vat: 0,
            discount: 0,
            debts: 0,
            balance: 0,
            grandTotal: 0,
            payment: 0
          },
          required: true
        },
        description: String
      }
    ],
    default: []
  },

  // billing
  isVat: Boolean,
  vatRatio: Number,
  discount: Number,
  expectedSecurityDeposit: Number,
  securityDeposit: {
    type: [
      {
        _id: false,
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        paymentType: {
          type: String,
          enum: [...PAYMENT_METHODS],
          required: true
        },
        reference: String
      }
    ],
    default: []
  },
  securityDepositRefund: {
    type: [
      {
        _id: false,
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        paymentType: {
          type: String,
          enum: [...PAYMENT_METHODS],
          required: true
        },
        reference: String
      }
    ],
    default: []
  },

  // ui state
  stepperMode: { type: Boolean, default: false }
});

export type TenantDocType<
  RealmType = string,
  LeaseType = string,
  PropertyType = string
> = MongooseDocType<TenantType<RealmType, LeaseType, PropertyType>>;

export default model<TenantDocType>('Occupant', TenantSchema);
