const mongoose = require('mongoose');
const Realm = require('./realm');

const LeaseSchema = mongoose.Schema({
  realmId: { type: String, ref: Realm },
  name: String,
  description: String,
  numberOfTerms: Number,
  timeRange: String, // days, weeks, months, years
  active: Boolean,

  // ui state
  stepperMode: { type: Boolean, default: false },
});

module.exports = mongoose.model('Lease', LeaseSchema);
