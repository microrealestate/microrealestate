import Model from './model.js';
import OF from './objectfilter.js';

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
      requiredOnceContractTerminated: Boolean
    });
  }
}

export default new TemplateModel();
