const mongoose = require('mongoose');
const Realm = require('./realm');
const Property = require('./property');
const Lease = require('./lease');

const TenantSchema = mongoose.Schema({
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
      email: String,
    },
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
      exitDate: Date,
    },
  ],
  rents: {},

  // billing
  isVat: Boolean,
  vatRatio: Number,
  discount: Number,
  guaranty: Number,
  guarantyPayback: Number,

  // ui state
  stepperMode: { type: Boolean, default: false },
});

module.exports = mongoose.model('Occupant', TenantSchema);
