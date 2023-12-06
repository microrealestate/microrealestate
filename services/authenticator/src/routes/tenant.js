const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const logger = require('winston');
const { config, TOKEN_COOKIE_ATTRIBUTES } = require('../config');
const TenantModel = require('@microrealestate/common/models/tenant');
const redis = require('@microrealestate/common/models/redis');

const tenantRouter = express.Router();

tenantRouter.post('/signin', async (req, res) => {
  try {
    let { email } = req.body;
    email = email?.trim().toLowerCase();
    if (!email) {
      logger.info('login failed some fields are missing');
      return res.status(422).json({ error: 'missing fields' });
    }

    const tenants = await TenantModel.find({ 'contacts.email': email });
    if (!tenants.length) {
      logger.info(`login failed for ${email} tenant not found`);
      return res.sendStatus(204);
    }

    const token = jwt.sign({ email }, config.RESET_TOKEN_SECRET, {
      expiresIn: '5m',
    });
    await redis.set(token, email);

    logger.debug(
      `create a new magic link token ${token} for email ${email} and domain ${req.hostname}`
    );

    // send email
    await axios.post(
      `${config.EMAILER_URL}/magiclink`,
      {
        templateName: 'magic_link',
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
  } catch (exc) {
    logger.error(exc.message || exc);
  }
  // always return 204 to avoid email enumeration
  res.sendStatus(204);
});

tenantRouter.delete('/signout', async (req, res) => {
  const sessionToken = req.cookies.sessionToken;
  logger.debug(`remove the session token: ${sessionToken}`);
  if (!sessionToken) {
    return res.sendStatus(204);
  }

  try {
    await redis.del(sessionToken);
    res.clearCookie('sessionToken', TOKEN_COOKIE_ATTRIBUTES);
    res.sendStatus(204);
  } catch (exc) {
    logger.error(exc);
    res.sendStatus(500);
  }
});

tenantRouter.get('/signedin', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.sendStatus(401);
  }

  const email = await redis.get(token);
  if (!email) {
    logger.error(`email not found for token ${token}. Magic link already used`);
    return res.sendStatus(401);
  }
  await redis.del(token);

  try {
    jwt.verify(token, config.RESET_TOKEN_SECRET);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(401);
  }

  const account = { email };
  const sessionToken = jwt.sign({ account }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: '30m',
  });
  await redis.set(sessionToken, email);
  res.json({ sessionToken });
});

tenantRouter.get('/session', async (req, res) => {
  const sessionToken = req.cookies.sessionToken;
  if (!sessionToken) {
    logger.error('token not found in cookies');
    return res.sendStatus(401);
  }

  const email = await redis.get(sessionToken);
  if (!email) {
    logger.error(`email not found for token ${sessionToken}`);
    return res.sendStatus(401);
  }

  try {
    jwt.verify(sessionToken, config.ACCESS_TOKEN_SECRET);
  } catch (error) {
    logger.error(error);
    return res.sendStatus(401);
  }

  return res.json({ email });
});

module.exports = tenantRouter;
