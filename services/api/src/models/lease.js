const OF = require('./objectfilter');
const Model = require('./model');

class LeaseModel extends Model {
  constructor() {
    super('leases');
    this.schema = new OF({
      _id: String,
      name: String,
      description: String,
      numberOfTerms: Number,
      timeRange: String, // days, weeks, months, years
      active: Boolean,

      // ui state
      stepperMode: Boolean,
    });
  }

  findAll(realm, callback) {
    super.findAll(realm, (errors, leases) => {
      if (errors && errors.length > 0) {
        callback(errors);
        return;
      }

      callback(
        null,
        leases.sort((p1, p2) => {
          return p1.name?.localeCompare(p2.name);
        })
      );
    });
  }
}

module.exports = new LeaseModel();
