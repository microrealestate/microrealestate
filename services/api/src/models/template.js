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
      contents: Object,
      html: String,
      linkedResourceIds: Array,
    });
  }
}

module.exports = new TemplateModel();
