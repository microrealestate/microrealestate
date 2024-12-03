const mongoose = require('mongoose');
const Realm = require('./realm');
const Tenant = require('./tenant');
const Lease = require('./lease');
const Template = require('./template');

const DocumentSchema = mongoose.Schema({
  realmId: { type: String, ref: Realm },
  tenantId: { type: String, ref: Tenant },
  leaseId: { type: String, ref: Lease },
  templateId: { type: String, ref: Template },
  type: String, // one of 'text', 'file'
  name: String,
  description: String,
  mimeType: String, // used only when type === "file"
  expiryDate: Date, // used only when type === "file"
  contents: Object, // used only when type === "text"
  html: String, // used only when type === "text"
  url: String, // used only when type === "file"
  versionId: String, // used only when type === "file"
  createdDate: Date,
  updatedDate: Date,
});

DocumentSchema.pre('save', function (next) {
  const now = new Date();
  if (!this.createdDate) {
    this.createdDate = now;
  }
  this.updatedDate = now;
  next();
});

DocumentSchema.pre('findOneAndUpdate', function (next) {
  this.getUpdate().$set.updatedDate = new Date();
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);
