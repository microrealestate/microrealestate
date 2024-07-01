import Model from './model.js';
import OF from './objectfilter.js';

class PropertyModel extends Model {
  constructor() {
    super('properties');
    this.schema = new OF({
      _id: String,
      type: String,
      name: String,
      description: String,
      surface: Number,
      phone: String,
      digicode: String,
      address: Object, // { street1, street2, zipCode, city, state, country }

      price: Number,

      // TODO moved in Occupant.properties model
      expense: Number,

      // TODO to remove, replaced by address
      building: String,
      level: String,
      location: String
    });
  }

  findAll(realm, callback) {
    super.findAll(realm, (errors, properties) => {
      if (errors && errors.length > 0) {
        callback(errors);
        return;
      }

      callback(
        null,
        properties.sort((p1, p2) => {
          if (p1.type === p2.type) {
            return p1.name.localeCompare(p2.name);
          }
          return p1.type.localeCompare(p2.type);
        })
      );
    });
  }
}

export default new PropertyModel();
