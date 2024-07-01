import OF from './objectfilter.js';

class RentModel {
  constructor() {
    this.paymentSchema = new OF({
      _id: String,
      month: Number,
      year: Number,
      payments: Array,
      description: String,
      promo: Number,
      notepromo: String,
      extracharge: Number,
      noteextracharge: String
    });
  }
}

export default new RentModel();
