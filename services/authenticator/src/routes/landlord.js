const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const axios = require('axios');
const locale = require('locale');
const logger = require('winston');
const { config, TOKEN_COOKIE_ATTRIBUTES } = require('../config');
const redis = require('@microrealestate/common/models/redis');
const AccountModel = require('@microrealestate/common/models/account');
const RealmModel = require('@microrealestate/common/models/realm');
const {
  needAccessToken,
  checkOrganization,
} = require('@microrealestate/common/utils/middlewares');

const _generateTokens = async (dbAccount) => {
  const { _id, password, ...account } = dbAccount;
  const refreshToken = jwt.sign({ account }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: '600s',
  });
  const accessToken = jwt.sign({ account }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: '30s',
  });

  // save tokens
  await redis.set(refreshToken, accessToken);

  return {
    refreshToken,
    accessToken,
  };
};

const _refreshTokens = async (oldRefreshToken) => {
  const oldAccessToken = await redis.get(oldRefreshToken);
  if (!oldAccessToken) {
    logger.error('refresh token not found in database');
    return {};
  }

  let account;
  try {
    const payload = jwt.verify(oldRefreshToken, config.REFRESH_TOKEN_SECRET);
    if (payload && payload.account) {
      account = payload.account;
    }
  } catch (exc) {
    logger.error(exc);
  }
  await _clearTokens(oldRefreshToken);

  if (!account) {
    return {};
  }

  return await _generateTokens(account);
};

const _clearTokens = async (refreshToken) => {
  await redis.del(refreshToken);
};

const landlordRouter = express.Router();

// parse locale
landlordRouter.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));

if (config.SIGNUP) {
  landlordRouter.post('/signup', async (req, res) => {
    try {
      const { firstname, lastname, email, password } = req.body;
      if (
        [firstname, lastname, email, password]
          .map((el) => el.trim())
          .some((el) => !!el === false)
      ) {
        return res.status(422).json({ error: 'missing fields' });
      }
      const existingAccount = await AccountModel.findOne({
        email: email.toLowerCase(),
      });
      if (existingAccount) {
        return res.sendStatus(409);
      }
      await AccountModel.create({ firstname, lastname, email, password });
      res.sendStatus(201);
    } catch (exc) {
      res.sendStatus(500);
    }
  });
}

const applicationSignIn = async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (
      [clientId, clientSecret]
        .map((el) => el.trim())
        .some((el) => !!el === false)
    ) {
      logger.info('M2M login failed some fields are missing');
      return res.status(422).json({ error: 'missing fields' });
    }

    // clientSecret is a JWT which contains the organizationId & clientId
    let organizationId;
    let keyId;
    try {
      const payload = jwt.verify(clientSecret, config.APPCREDZ_TOKEN_SECRET);
      if (payload?.organizationId && payload?.jti) {
        organizationId = payload.organizationId;
        keyId = payload.jti;
      } else {
        logger.error(
          'Provided clientSecret is valid but does not have required fields'
        );
        return res.status(401).json({ error: 'invalid credentials' });
      }
    } catch (exc) {
      if (exc instanceof jwt.TokenExpiredError) {
        logger.info(
          `login failed for application ${clientId}@${organizationId}: expired token`
        );
        return res.status(401).json({ error: 'expired clientId' });
      } else {
        logger.error(exc);
        return res.status(401).json({ error: 'invalid credentials' });
      }
    }

    // ensure keyId & clientId matches
    if (clientId !== keyId) {
      logger.info(
        `login failed for application ${clientId}@${organizationId}: clientId & clientSecret not matching`
      );
      return res.status(401).json({ error: 'invalid credentials' });
    }

    // find the client details within the realm
    const realm = (
      await RealmModel.findOne({ _id: organizationId })
    )?.toObject();
    if (!realm) {
      logger.info(
        `login failed for application ${clientId}@${organizationId}: realm not found`
      );
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const application = realm.applications?.find(
      (app) => app?.clientId === clientId
    );
    if (!application) {
      logger.info(
        `login failed for application ${clientId}@${organizationId}: appplication revoked`
      );
      return res.status(401).json({ error: 'revoked clientId' });
    }

    // check clientSecret
    const validSecret = await bcrypt.compare(
      clientSecret,
      application.clientSecret
    );
    if (!validSecret) {
      logger.info(
        `login failed for application ${clientId}@${organizationId}: bad secret`
      );
      return res.status(401).json({ error: 'invalid credentials' });
    }

    // Generate only an accessToken, but no refreshToken
    delete application.clientSecret;
    const accessToken = jwt.sign({ application }, config.ACCESS_TOKEN_SECRET, {
      expiresIn: '300s',
    });

    res.json({
      accessToken,
      organizationId,
    });
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
};

const userSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if ([email, password].map((el) => el.trim()).some((el) => !!el === false)) {
      logger.info('login failed some fields are missing');
      return res.status(422).json({ error: 'missing fields' });
    }

    const account = await AccountModel.findOne({ email: email.toLowerCase() });
    if (!account) {
      logger.info(`login failed for ${email} account not found`);
      return res.sendStatus(401);
    }

    const validPassword = await bcrypt.compare(password, account.password);
    if (!validPassword) {
      logger.info(`login failed for ${email} bad password`);
      return res.sendStatus(401);
    }

    const { refreshToken, accessToken } = await _generateTokens(
      account.toObject()
    );

    logger.debug(
      `create a new refresh token ${refreshToken} for domain ${req.hostname}`
    );
    res.cookie('refreshToken', refreshToken, TOKEN_COOKIE_ATTRIBUTES);
    res.json({
      accessToken,
    });
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
};

landlordRouter.post('/signin', async (req, res) => {
  if (req.body.email) {
    return await userSignIn(req, res);
  } else if (req.body.clientId) {
    return await applicationSignIn(req, res);
  } else {
    logger.info('login failed some fields are missing');
    return res.status(422).json({ error: 'missing fields' });
  }
});

landlordRouter.use('/appcredz', needAccessToken(config.ACCESS_TOKEN_SECRET));
landlordRouter.use('/appcredz', checkOrganization());
landlordRouter.post('/appcredz', async (req, res) => {
  // ensure the user is administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({
      error: 'only administrator member can generate application credentials',
    });
  }

  try {
    const { expiry, organizationId } = req.body;
    if (
      [expiry, organizationId]
        .map((el) => el.trim())
        .some((el) => !!el === false)
    ) {
      logger.info('AppCredz creation failed some fields are missing');
      return res.status(422).json({ error: 'missing fields' });
    }
    const expiryDate = new Date(expiry);

    // Create clientId & clientSecret
    const clientId = crypto.randomUUID();
    const clientSecret = jwt.sign(
      {
        organizationId,
        jti: clientId,
        exp: expiryDate.getTime() / 1000,
      },
      config.APPCREDZ_TOKEN_SECRET
    );

    res.json({
      clientId,
      clientSecret,
    });
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

landlordRouter.post('/refreshtoken', async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  logger.debug(`give a new refresh token for ${oldRefreshToken}`);
  if (!oldRefreshToken) {
    return res.sendStatus(403);
  }

  try {
    const { refreshToken, accessToken } = await _refreshTokens(oldRefreshToken);
    if (!refreshToken) {
      res.clearCookie('refreshToken', TOKEN_COOKIE_ATTRIBUTES);
      return res.sendStatus(403);
    }

    res.cookie('refreshToken', refreshToken, TOKEN_COOKIE_ATTRIBUTES);
    res.json({
      accessToken,
    });
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

landlordRouter.delete('/signout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  logger.debug(`remove the refresh token: ${refreshToken}`);
  if (!refreshToken) {
    return res.sendStatus(202);
  }

  try {
    res.clearCookie('refreshToken', TOKEN_COOKIE_ATTRIBUTES);
    await _clearTokens(refreshToken);
    res.sendStatus(204);
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

landlordRouter.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ error: 'missing fields' });
    }
    // check if user exists
    const account = await AccountModel.findOne({ email: email.toLowerCase() });
    if (account) {
      // generate reset token valid for one hour
      const token = jwt.sign({ email }, config.RESET_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      await redis.set(token, email);

      // send email
      await axios.post(
        `${config.EMAILER_URL}/resetpassword`,
        {
          templateName: 'reset_password',
          recordId: email,
          params: {
            token,
          },
        },
        {
          headers: {
            'Accept-Language': req.rawLocale.code,
          },
        }
      );
    }
    res.sendStatus(204);
  } catch (error) {
    logger.error(error.message || error);
    res.sendStatus(500);
  }
});

landlordRouter.patch('/resetpassword', async (req, res) => {
  const { resetToken, password } = req.body;
  if (
    [resetToken, password].map((el) => el.trim()).some((el) => !!el === false)
  ) {
    return res.status(422).json({ error: 'missing fields' });
  }

  const email = await redis.get(resetToken);
  if (!email) {
    return res.sendStatus(403);
  }

  await redis.del(resetToken);

  try {
    jwt.verify(resetToken, config.RESET_TOKEN_SECRET);
  } catch (error) {
    console.error(error);
    return res.sendStatus(403);
  }

  try {
    const account = await AccountModel.findOne({ email: email.toLowerCase() });
    account.password = password;
    await account.save();
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }

  res.sendStatus(200);
});

module.exports = landlordRouter;
