const mongoose = require('mongoose');
const Realm = require('./realm');

const TemplateSchema = mongoose.Schema({
  realmId: { type: String, ref: Realm },
  name: String,
  type: String, // one of 'text', 'fileDescriptor'
  description: String,
  hasExpiryDate: Boolean,
  contents: Object,
  html: String,
  linkedResourceIds: Array,
  required: Boolean,
  requiredOnceContractTerminated: Boolean,
});

module.exports = mongoose.model('Template', TemplateSchema);
