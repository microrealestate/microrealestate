const OF = require('./objectfilter');
const Model = require('./model');

class DocumentModel extends Model {
  constructor() {
    super('documents');
    this.schema = new OF({
      _id: String,
      tenantId: String,
      leaseId: String,
      name: String,
      type: String,
      description: String,
      contents: Object,
      html: String,
    });
  }
}

module.exports = new DocumentModel();
