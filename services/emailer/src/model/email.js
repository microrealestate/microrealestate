const mongoose = require('mongoose');

const EmailSchema = mongoose.Schema({
  templateName: String,
  recordId: String,
  params: {},
  sentTo: String,
  sentDate: Date,
  status: String,
  emailId: String,
});

module.exports = mongoose.model('Email', EmailSchema);
