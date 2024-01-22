const bcrypt = require('bcrypt');
const logger = require('winston');
const realmModel = require('../models/realm');
const accountModel = require('../models/account');
const crypto = require('@microrealestate/common/utils/crypto');

const SECRET_PLACEHOLDER = '**********';

const _hasRequiredFields = (realm) => {
  return (
    realm.name &&
    realm.members &&
    realm.members.find(({ role }) => role === 'administrator') &&
    realm.locale &&
    realm.currency
  );
};

const _isNameAlreadyTaken = (realm, realms = []) => {
  return realms
    .map(({ name }) => name.trim().toLowerCase())
    .includes(realm.name.trim().toLowerCase());
};

const _escapeSecrets = (realm) => {
  if (realm.thirdParties?.gmail?.appPassword) {
    realm.thirdParties.gmail.appPassword = SECRET_PLACEHOLDER;
  }
  if (realm.thirdParties?.smtp?.password) {
    realm.thirdParties.smtp.password = SECRET_PLACEHOLDER;
  }
  if (realm.thirdParties?.mailgun?.apiKey) {
    realm.thirdParties.mailgun.apiKey = SECRET_PLACEHOLDER;
  }
  if (realm.thirdParties?.b2?.keyId) {
    realm.thirdParties.b2.keyId = SECRET_PLACEHOLDER;
  }
  if (realm.thirdParties?.b2?.applicationKey) {
    realm.thirdParties.b2.applicationKey = SECRET_PLACEHOLDER;
  }
  for (const app of realm.applications) {
    app.clientSecret = SECRET_PLACEHOLDER;
  }
  return realm;
};

module.exports = {
  add(req, res) {
    const newRealm = realmModel.schema.filter(req.body);

    delete req.body.thirdParties?.gmail?.appPasswordUpdated;
    delete req.body.thirdParties?.smtp?.passwordUpdated;
    delete req.body.thirdParties?.mailgun?.apiKeyUpdated;
    delete req.body.thirdParties?.b2?.keyIdUpdated;
    delete req.body.thirdParties?.b2?.applicationKeyUpdated;

    if (!_hasRequiredFields(newRealm)) {
      return res.status(422).json({ error: 'missing fields' });
    }

    if (_isNameAlreadyTaken(newRealm, req.realms)) {
      return res
        .status(409)
        .json({ error: 'organization name already exists' });
    }

    if (newRealm.thirdParties?.gmail?.appPassword) {
      newRealm.thirdParties.gmail.appPassword = crypto.encrypt(
        newRealm.thirdParties.gmail.appPassword
      );
    }

    if (newRealm.thirdParties?.smtp?.password) {
      newRealm.thirdParties.smtp.password = crypto.encrypt(
        newRealm.thirdParties.smtp.password
      );
    }

    if (newRealm.thirdParties?.mailgun?.apiKey) {
      newRealm.thirdParties.mailgun.apiKey = crypto.encrypt(
        newRealm.thirdParties.mailgun.apiKey
      );
    }

    if (newRealm.thirdParties?.b2?.applicationKey) {
      newRealm.thirdParties.b2.applicationKey = crypto.encrypt(
        newRealm.thirdParties.b2.applicationKey
      );
    }

    if (newRealm.thirdParties?.b2?.keyId) {
      newRealm.thirdParties.b2.keyId = crypto.encrypt(
        newRealm.thirdParties.b2.keyId
      );
    }

    // Hash all applications' clientSecret
    for (const app of newRealm.applications) {
      app.createdDate = new Date();
      app.clientSecret = bcrypt.hashSync(app.clientSecret, 10);
    }

    realmModel.add(newRealm, (errors, realm) => {
      if (errors) {
        return res.status(500).json({
          errors: errors,
        });
      }
      res.status(201).json(_escapeSecrets(realm));
    });
  },
  async update(req, res) {
    const gmailAppPasswordUpdated =
      !!req.body.thirdParties?.gmail?.appPasswordUpdated;
    const smtpPasswordUpdated = !!req.body.thirdParties?.smtp?.passwordUpdated;
    const mailgunApiKeyUpdated =
      !!req.body.thirdParties?.mailgun?.apiKeyUpdated;
    const b2KeyIdUpdated = !!req.body.thirdParties?.b2?.keyIdUpdated;
    const b2ApplicationKeyUpdated =
      !!req.body.thirdParties?.b2?.applicationKeyUpdated;
    const updatedRealm = realmModel.schema.filter(req.body);

    delete req.body.thirdParties?.gmail?.appPasswordUpdated;
    delete req.body.thirdParties?.smtp?.passwordUpdated;
    delete req.body.thirdParties?.mailgun?.apiKeyUpdated;
    delete req.body.thirdParties?.b2?.keyIdUpdated;
    delete req.body.thirdParties?.b2?.applicationKeyUpdated;

    if (req.realm._id !== updatedRealm._id) {
      return res
        .status(403)
        .json({ error: 'only current selected organization can be updated' });
    }

    let currentMember;
    if (req.user) {
      currentMember = req.realm.members.find(
        ({ email }) => email === req.user.email
      );
    } else if (req.application) {
      currentMember = req.realm.applications.find(
        ({ clientId }) => clientId === req.application.clientId
      );
    } else {
      logger.error('updating organization with unknown user type');
      return res.sendStatus(500);
    }

    if (!currentMember) {
      return res
        .status(403)
        .json({ error: 'current user is not a member of the organization' });
    }

    if (req.role !== 'administrator') {
      return res.status(403).json({
        error: 'only administrator member can update the organization',
      });
    }

    if (!_hasRequiredFields(updatedRealm)) {
      return res.status(422).json({ error: 'missing fields' });
    }

    if (
      updatedRealm.name.trim().toLowerCase() !==
        req.realm.name.trim().toLowerCase() &&
      _isNameAlreadyTaken(updatedRealm, req.realms)
    ) {
      return res
        .status(409)
        .json({ error: 'organization name already exists' });
    }

    if (updatedRealm.thirdParties?.gmail) {
      logger.debug('realm update with Gmail third party emailer');
      if (gmailAppPasswordUpdated) {
        updatedRealm.thirdParties.gmail.appPassword = crypto.encrypt(
          updatedRealm.thirdParties.gmail.appPassword
        );
      } else if (req.realm.thirdParties?.gmail?.appPassword) {
        updatedRealm.thirdParties.gmail.appPassword =
          req.realm.thirdParties.gmail.appPassword;
      }
    }

    if (updatedRealm.thirdParties?.smtp) {
      logger.debug('realm update with SMTP third party emailer');
      if (smtpPasswordUpdated) {
        updatedRealm.thirdParties.smtp.password = crypto.encrypt(
          updatedRealm.thirdParties.smtp.password
        );
      } else if (req.realm.thirdParties?.smtp?.password) {
        updatedRealm.thirdParties.smtp.password =
          req.realm.thirdParties.smtp.password;
      }
    }

    if (updatedRealm.thirdParties?.mailgun) {
      logger.debug('realm update with Mailgun third party emailer');
      if (mailgunApiKeyUpdated) {
        updatedRealm.thirdParties.mailgun.apiKey = crypto.encrypt(
          updatedRealm.thirdParties.mailgun.apiKey
        );
      } else if (req.realm.thirdParties?.mailgun?.apiKey) {
        updatedRealm.thirdParties.mailgun.apiKey =
          req.realm.thirdParties.mailgun.apiKey;
      }
    }

    if (updatedRealm.thirdParties?.b2) {
      if (b2KeyIdUpdated) {
        updatedRealm.thirdParties.b2.keyId = crypto.encrypt(
          updatedRealm.thirdParties.b2.keyId
        );
      } else if (req.realm.thirdParties?.b2?.keyId) {
        updatedRealm.thirdParties.b2.keyId = req.realm.thirdParties.b2.keyId;
      }

      if (b2ApplicationKeyUpdated) {
        updatedRealm.thirdParties.b2.applicationKey = crypto.encrypt(
          updatedRealm.thirdParties.b2.applicationKey
        );
      } else if (req.realm.thirdParties?.b2?.applicationKey) {
        updatedRealm.thirdParties.b2.applicationKey =
          req.realm.thirdParties.b2.applicationKey;
      }
    }

    const usernameMap = {};
    try {
      await new Promise((resolve, reject) => {
        accountModel.findAll((errors, accounts = []) => {
          if (errors) {
            return reject(errors);
          }
          resolve(
            accounts.reduce((acc, { email, firstname, lastname }) => {
              acc[email] = `${firstname} ${lastname}`;
              return acc;
            }, usernameMap)
          );
        });
      });
    } catch (error) {
      logger.error(error);
    }

    updatedRealm.members.forEach((member) => {
      const name = usernameMap[member.email];
      member.name = name || '';
      member.registered = !!name;
    });

    // Prevent AppCredz updates: only creation & deletion is permitted
    const prevAppcredzMap = {};
    req.realm.applications.reduce((acc, app) => {
      acc[app.clientId] = app;
      return acc;
    }, prevAppcredzMap);

    updatedRealm.applications = updatedRealm.applications.map((app) => {
      if (prevAppcredzMap[app.clientId]) {
        return prevAppcredzMap[app.clientId];
      }
      // for new entries initialize date & hash secret
      app.createdDate = new Date();
      app.clientSecret = bcrypt.hashSync(app.clientSecret, 10);
      return app;
    });

    realmModel.update(updatedRealm, (errors, realm) => {
      if (errors) {
        return res.status(500).json({
          errors: errors,
        });
      }
      res.status(200).json(_escapeSecrets(realm));
    });
  },
  remove(/*req, res*/) {},
  one(req, res) {
    const realmId = req.params.id;
    if (!realmId) {
      return res.sendStatus(404);
    }

    const realm = req.realms.find(({ _id }) => _id.toString() === realmId);
    if (!realm) {
      return res.sendStatus(404);
    }

    res.json(_escapeSecrets(realm));
  },
  all(req, res) {
    res.json(req.realms.map((realm) => _escapeSecrets(realm)));
  },
};
