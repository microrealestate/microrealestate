const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const locale = require('locale');
const logger = require('winston');
const config = require('./config');
const redis = require('@mre/common/models/redis');
const AccountModel = require('@mre/common/models/account');

const APP_URL = new URL(config.APP_URL);
const refreshTokenCookieAttributes = {
  httpOnly: true,
  sameSite: 'Strict',
  secure: APP_URL.protocol === 'https:',
  domain: APP_URL.hostname,
};

const _generateTokens = async (dbAccount) => {
  const { _id, password, ...account } = dbAccount;
  const refreshToken = jwt.sign({ account }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: '600s',
  });
  const accessToken = jwt.sign({ account }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: '10s',
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

const apiRouter = express.Router();

// parse locale
apiRouter.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));

if (config.SIGNUP) {
  apiRouter.post('/signup', async (req, res) => {
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

apiRouter.post('/signin', async (req, res) => {
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
    res.cookie('refreshToken', refreshToken, refreshTokenCookieAttributes);
    res.json({
      accessToken,
    });
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

apiRouter.post('/refreshtoken', async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  logger.debug(`give a new refresh token for ${oldRefreshToken}`);
  if (!oldRefreshToken) {
    return res.sendStatus(403);
  }

  try {
    const { refreshToken, accessToken } = await _refreshTokens(oldRefreshToken);
    if (!refreshToken) {
      res.clearCookie('refreshToken', refreshTokenCookieAttributes);
      return res.sendStatus(403);
    }

    res.cookie('refreshToken', refreshToken, refreshTokenCookieAttributes);
    res.json({
      accessToken,
    });
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

apiRouter.delete('/signout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  logger.debug(`remove the refresh token: ${refreshToken}`);
  if (!refreshToken) {
    return res.sendStatus(202);
  }

  try {
    res.clearCookie('refreshToken', refreshTokenCookieAttributes);
    await _clearTokens(refreshToken);
    res.sendStatus(204);
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

apiRouter.post('/forgotpassword', async (req, res) => {
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
    logger.error(error.data ? error.data : error);
    res.sendStatus(500);
  }
});

apiRouter.patch('/resetpassword', async (req, res) => {
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

module.exports = apiRouter;
