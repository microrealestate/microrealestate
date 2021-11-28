const mongoose = require('mongoose');

// Needed as used in model as ref
require('./template');

const LeaseSchema = mongoose.Schema({
  realmId: { type: String, ref: 'Realm' },
  name: String,
  description: String,
  numberOfTerms: Number,
  timeRange: String, // days, weeks, months, years
  active: Boolean,
  system: Boolean,
  templateIds: { type: Array, ref: 'Template' },
});

module.exports = mongoose.model('Lease', LeaseSchema);
