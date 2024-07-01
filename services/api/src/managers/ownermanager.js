import realmModel from '../models/realm.js';

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export function all(req, res) {
  const realm = req.realm;
  realmModel.findOne(realm._id, (errors, dbRealm) => {
    if (errors && errors.length > 0) {
      res.json({
        errors: errors
      });
      return;
    }
    res.json({
      _id: dbRealm._id,
      isCompany: dbRealm.isCompany,
      company: dbRealm.companyInfo.name,
      legalForm: dbRealm.companyInfo.legalStructure,
      capital: dbRealm.companyInfo.capital,
      siret: dbRealm.companyInfo.ein,
      dos: dbRealm.companyInfo.dos,
      vatNumber: dbRealm.companyInfo.vatNumber,
      manager: dbRealm.companyInfo.legalRepresentative,
      street1: dbRealm.addresses[0].street1,
      street2: dbRealm.addresses[0].street2,
      zipCode: dbRealm.addresses[0].zipCode,
      city: dbRealm.addresses[0].city,
      state: dbRealm.addresses[0].state,
      country: dbRealm.addresses[0].country,
      contact: dbRealm.contacts[0].name,
      email: dbRealm.contacts[0].email,
      phone1: dbRealm.contacts[0].phone1,
      phone2: dbRealm.contacts[0].phone2,
      bank: dbRealm.bankInfo.name,
      rib: dbRealm.bankInfo.iban
    });
  });
}

export function update(req, res) {
  const realm = req.realm;
  const owner = req.body;

  realm.isCompany = owner.isCompany;
  realm.companyInfo = {
    name: owner.company,
    legalStructure: owner.legalForm,
    capital: owner.capital,
    ein: owner.siret,
    dos: owner.dos,
    vatNumber: owner.vatNumber,
    legalRepresentative: owner.manager
  };

  realm.addresses = [
    {
      street1: owner.street1,
      street2: owner.street2,
      zipCode: owner.zipCode,
      city: owner.city,
      state: owner.state,
      country: owner.country
    }
  ];

  realm.contacts = [
    {
      name: owner.contact,
      email: owner.email,
      phone1: owner.phone1,
      phone2: owner.phone2
    }
  ];

  realm.bankInfo = {
    name: owner.bank,
    iban: owner.rib
  };

  realmModel.update(realmModel.schema.filter(realm), (errors) => {
    res.json({ errors: errors });
  });
}
