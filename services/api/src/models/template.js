const OF = require('./objectfilter');
const Model = require('./model');

class TemplateModel extends Model {
  constructor() {
    super('templates');
    this.schema = new OF({
      _id: String,
      name: String,
      type: String,
      description: String,
      hasExpiryDate: Boolean,
      contents: Object,
      html: String,
      linkedResourceIds: Array,
      required: Boolean,
      requiredOnceContractTerminated: Boolean,
    });
  }
}

module.exports = new TemplateModel();
