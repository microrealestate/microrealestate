const mongoose = require('mongoose');
const Realm = require('./realm');

const TemplateSchema = mongoose.Schema({
  realmId: { type: String, ref: Realm },
  name: String,
  type: String,
  description: String,
  contents: Object,
  html: String,
  linkedResourceIds: Array,
});

module.exports = mongoose.model('Template', TemplateSchema);
