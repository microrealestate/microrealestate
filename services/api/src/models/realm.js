import logger from 'winston';
import Model from './model.js';
import OF from './objectfilter.js';

class RealmModel extends Model {
  constructor() {
    super('realms');
    this.schema = new OF({
      _id: String,
      name: String,
      members: Array, // [{ name, email, role, registered },]
      applications: Array, // [{ name, role, clientId, createdDate, expiryDate },]
      addresses: Array, // [{ street1, street2, zipCode, city, state, country }, ]
      bankInfo: Object, // { name, iban }
      contacts: Array, // [{ name, email, phone1, phone2 }]
      isCompany: Boolean,
      companyInfo: Object, // { name, legalStructure, capital, ein, dos, vatNumber, legalRepresentative }
      thirdParties: Object, // { gmail: { selected, email, appPassword, fromEmail, replyToEmail }, mailgun: { selected, apiKey, domain, fromEmail, replyToEmail }, b2: { keyId, applicationKey, endpoint, bucket } },
      locale: String,
      currency: String
    });
  }

  findOne(id, callback) {
    super.findOne(null, id, function (errors, realm) {
      if (errors) {
        callback(errors);
      } else if (!realm) {
        callback(['realm not found']);
      } else {
        callback(null, realm);
      }
    });
  }

  findAll(callback) {
    super.findAll(null, function (errors, realms) {
      if (errors) {
        callback(errors);
      } else if (!realms || realms.length === 0) {
        callback(null, null);
      } else {
        callback(null, realms);
      }
    });
  }

  findByEmail(email, callback) {
    // TODO to optimize: filter should by applied on DB
    super.findAll(null, function (errors, realms) {
      if (errors) {
        callback(errors);
      } else if (!realms || realms.length === 0) {
        callback(null, null);
      } else {
        const realmsFound = realms.filter((realm) =>
          realm.members?.map(({ email }) => email).includes(email)
        );
        callback(null, realmsFound);
      }
    });
  }

  add(realm, callback) {
    super.add(null, realm, callback);
  }

  update(realm, callback) {
    super.update(null, realm, callback);
  }

  remove() {
    logger.error('method not implemented!');
  }
}

export default new RealmModel();
