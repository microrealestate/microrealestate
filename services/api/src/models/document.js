const OF = require('./objectfilter');
const Model = require('./model');

class DocumentModel extends Model {
  constructor() {
    super('documents');
    this.schema = new OF({
      _id: String,
      tenantId: String,
      leaseId: String,
      templateId: String,
      name: String,
      type: String,
      mimeType: String,
      description: String,
      expiryDate: Date,
      contents: Object,
      html: String,
      url: String,
      versionId: String,
      createdDate: Date,
      updatedDate: Date,
    });
  }
}

module.exports = new DocumentModel();
