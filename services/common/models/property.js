const mongoose = require('mongoose');
const Realm = require('./realm');

const PropertySchema = mongoose.Schema({
  realmId: { type: String, ref: Realm },
  //occupant: ObjectId,
  //occupantLabel: String,

  type: String,
  name: String,
  description: String,
  surface: Number,
  phone: String,
  digicode: String,
  address: {
    _id: false,
    street1: String,
    street2: String,
    zipCode: String,
    city: String,
    state: String,
    country: String,
  },

  price: Number,

  // TODO moved in Occupant.properties model
  // expense: Number,

  // TODO to remove, replaced by address
  building: String,
  level: String,
  location: String,
});

module.exports = mongoose.model('Property', PropertySchema);
