import {
  Collections,
  Crypto,
  logger,
  ServiceError
} from '@microrealestate/common';

const SECRET_PLACEHOLDER = '**********';

function _hasRequiredFields(realm) {
  [
    { name: 'name', provided: !!realm.name },
    { name: 'members', provided: !!realm.members },
    { name: 'currency', provided: !!realm.currency },
    {
      name: 'member with administator role',
      provided: !!realm.members.find(({ role }) => role === 'administrator')
    },
    { name: 'locale', provided: !!realm.locale }
  ].forEach((field) => {
    if (!field.provided) {
      logger.error(`missing landlord ${field.name}`);
      throw new ServiceError('missing fields', 422);
    }
  });
}

function _isNameAlreadyTaken(realm, realms = []) {
  if (
    realms
      .map(({ name }) => name.trim().toLowerCase())
      .includes(realm.name.trim().toLowerCase())
  ) {
    throw new ServiceError('landlord name already taken', 409);
  }
}

function _escapeSecrets(realm) {
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
}

export async function add(req, res) {
  const newRealm = new Collections.Realm(req.body);

  _hasRequiredFields(newRealm);
  _isNameAlreadyTaken(newRealm, req.realms);

  if (newRealm.thirdParties?.gmail?.appPassword) {
    newRealm.thirdParties.gmail.appPassword = Crypto.encrypt(
      newRealm.thirdParties.gmail.appPassword
    );
  }

  if (newRealm.thirdParties?.smtp?.password) {
    newRealm.thirdParties.smtp.password = Crypto.encrypt(
      newRealm.thirdParties.smtp.password
    );
  }

  if (newRealm.thirdParties?.mailgun?.apiKey) {
    newRealm.thirdParties.mailgun.apiKey = Crypto.encrypt(
      newRealm.thirdParties.mailgun.apiKey
    );
  }

  if (newRealm.thirdParties?.b2?.applicationKey) {
    newRealm.thirdParties.b2.applicationKey = Crypto.encrypt(
      newRealm.thirdParties.b2.applicationKey
    );
  }

  if (newRealm.thirdParties?.b2?.keyId) {
    newRealm.thirdParties.b2.keyId = Crypto.encrypt(
      newRealm.thirdParties.b2.keyId
    );
  }

  res.json(_escapeSecrets(await newRealm.save()));
}

export async function update(req, res) {
  const gmailAppPasswordUpdated =
    !!req.body.thirdParties?.gmail?.appPasswordUpdated;
  const smtpPasswordUpdated = !!req.body.thirdParties?.smtp?.passwordUpdated;
  const mailgunApiKeyUpdated = !!req.body.thirdParties?.mailgun?.apiKeyUpdated;
  const b2KeyIdUpdated = !!req.body.thirdParties?.b2?.keyIdUpdated;
  const b2ApplicationKeyUpdated =
    !!req.body.thirdParties?.b2?.applicationKeyUpdated;

  if (req.realm._id !== req.body?._id) {
    throw new ServiceError(
      'only current selected organization can be updated',
      403
    );
  }

  // No need to check wether user is part of org as it is already done by
  // the middleware
  if (req.user.role !== 'administrator') {
    throw new ServiceError(
      'only administrator member can update the organization',
      403
    );
  }

  // retrieve the document from mongo & update it
  const previousRealm = await Collections.Realm.findOne({
    _id: req.body._id
  });
  const updatedRealm = { ...previousRealm.toObject(), ...req.body };

  _hasRequiredFields(updatedRealm);
  if (
    updatedRealm.name.trim().toLowerCase() !==
    req.realm.name.trim().toLowerCase()
  ) {
    _isNameAlreadyTaken(updatedRealm, req.realms);
  }

  if (req.body.thirdParties?.gmail) {
    logger.debug('realm update with Gmail third party emailer');
    if (gmailAppPasswordUpdated) {
      updatedRealm.thirdParties.gmail.appPassword = Crypto.encrypt(
        req.body.thirdParties.gmail.appPassword
      );
    } else {
      updatedRealm.thirdParties.gmail.appPassword =
        previousRealm.thirdParties.gmail?.appPassword;
    }
  }

  if (req.body.thirdParties?.smtp) {
    logger.debug('realm update with SMTP third party emailer');
    if (smtpPasswordUpdated) {
      updatedRealm.thirdParties.smtp.password = Crypto.encrypt(
        req.body.thirdParties.smtp.password
      );
    } else {
      updatedRealm.thirdParties.smtp.password =
        previousRealm.thirdParties.smtp.password;
    }
  }

  if (req.body.thirdParties?.mailgun) {
    logger.debug('realm update with Mailgun third party emailer');
    if (mailgunApiKeyUpdated) {
      updatedRealm.thirdParties.mailgun.apiKey = Crypto.encrypt(
        req.body.thirdParties.mailgun.apiKey
      );
    } else {
      updatedRealm.thirdParties.mailgun.apiKey =
        previousRealm.thirdParties.mailgun.apiKey;
    }
  }

  if (req.body.thirdParties?.b2) {
    if (b2KeyIdUpdated) {
      updatedRealm.thirdParties.b2.keyId = Crypto.encrypt(
        req.body.thirdParties.b2.keyId
      );
    } else {
      updatedRealm.thirdParties.b2.keyId = previousRealm.thirdParties.b2.keyId;
    }

    if (b2ApplicationKeyUpdated) {
      updatedRealm.thirdParties.b2.applicationKey = Crypto.encrypt(
        req.body.thirdParties.b2.applicationKey
      );
    } else {
      updatedRealm.thirdParties.b2.applicationKey =
        previousRealm.thirdParties.b2.applicationKey;
    }
  }

  const dbAccounts = await Collections.Account.find().lean();
  const usernameMap = dbAccounts.reduce(
    (acc, { email, firstname, lastname }) => {
      acc[email] = `${firstname} ${lastname}`;
      return acc;
    },
    {}
  );

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
    return app;
  });

  previousRealm.set(updatedRealm);
  res.json(_escapeSecrets(await previousRealm.save()));
}

export function one(req, res) {
  const realmId = req.params.id;
  if (!realmId) {
    logger.error('missing landlord id');
    throw new ServiceError('missing fields', 422);
  }

  const realm = req.realms.find(({ _id }) => _id.toString() === realmId);
  if (!realm) {
    throw new ServiceError('landlord not found', 404);
  }

  res.json(_escapeSecrets(realm));
}

export function all(req, res) {
  res.json(req.realms.map((realm) => _escapeSecrets(realm)));
}
