const mongoose = require('mongoose');
const Realm = require('./realm');
const Property = require('./property');

const ObjectId = mongoose.Schema.Types.ObjectId;

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
  beginDate: String,
  endDate: String, //"30/11/2013",
  terminationDate: String,
  properties: [
    {
      propertyId: { type: ObjectId, ref: Property },
      entryDate: String,
      exitDate: String,
    },
  ],
  rents: {},

  // billing
  isVat: Boolean,
  vatRatio: Number,
  discount: Number,
  guaranty: Number,
});

module.exports = mongoose.model('Occupant', TenantSchema);
