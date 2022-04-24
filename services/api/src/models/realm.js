const OF = require('./objectfilter');
const Model = require('./model');
const logger = require('winston');

class RealmModel extends Model {
  constructor() {
    super('realms');
    this.schema = new OF({
      _id: String,
      name: String,
      members: Array, // [{ name, email, role, registered },]
      addresses: Array, // [{ street1, street2, zipCode, city, state, country }, ]
      bankInfo: Object, // { name, iban }
      contacts: Array, // [{ name, email, phone1, phone2 }]
      isCompany: Boolean,
      companyInfo: Object, // { name, legalStructure, capital, ein, dos, vatNumber, legalRepresentative }
      locale: String,
      currency: String,
      tenants: Array, // [{ name, emails, access },]
      thirdParties: Object, // { mailgun: { apiKey, domain, fromEmail, replyToEmail }, b2: { keyId, applicationKey, endpoint, bucket } },

      // TODO to remove, replaced by companyInfo
      creation: String,
      company: String,
      legalForm: String,
      vatNumber: String,
      capital: Number,
      siret: String,
      rcs: String,
      manager: String,

      // TODO to remove, replaced by bankInfo
      bank: String,
      rib: String,

      // TODO to remove, replaced by contacts
      contact: String,
      email: String,
      phone1: String,
      phone2: String,

      // TODO to remove, replaced by addresses
      street1: String,
      street2: String,
      zipCode: String,
      city: String,

      // TODO to remove, replaced by members
      administrator: String,
      user1: String,
      user2: String,
      user3: String,
      user4: String,
      user5: String,
      user6: String,
      user7: String,
      user8: String,
      user9: String,
      user10: String,
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

module.exports = new RealmModel();
