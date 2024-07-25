import {
  Collections,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import axios from 'axios';
import express from 'express';
import jwt from 'jsonwebtoken';

export default function () {
  const {
    EMAILER_URL,
    RESET_TOKEN_SECRET,
    ACCESS_TOKEN_SECRET,
    TOKEN_COOKIE_ATTRIBUTES,
    PRODUCTION
  } = Service.getInstance().envConfig.getValues();
  const tenantRouter = express.Router();

  tenantRouter.post(
    '/signin',
    Middlewares.asyncWrapper(async (req, res) => {
      let { email } = req.body;
      email = email?.trim().toLowerCase();
      if (!email) {
        logger.error('missing email field');
        throw new ServiceError('missing fields', 422);
      }

      const tenants = await Collections.Tenant.find({
        'contacts.email': email
      });
      if (!tenants.length) {
        logger.info(`login failed for ${email} tenant not found`);
        return res.sendStatus(204);
      }

      const token = jwt.sign({ email }, RESET_TOKEN_SECRET, {
        expiresIn: '5m'
      });
      await Service.getInstance().redisClient.set(token, email);

      logger.debug(
        `create a new magic link token ${token} for email ${email} and domain ${req.hostname}`
      );

      // send email
      await axios.post(
        `${EMAILER_URL}/magiclink`,
        {
          templateName: 'magic_link',
          recordId: email,
          params: {
            token
          }
        },
        {
          headers: {
            'Accept-Language': req.rawLocale.code
          }
        }
      );

      // always return 204 to avoid email enumeration
      res.sendStatus(204);
    })
  );

  tenantRouter.delete(
    '/signout',
    Middlewares.asyncWrapper(async (req, res) => {
      const sessionToken = req.cookies.sessionToken;
      logger.debug(`remove the session token: ${sessionToken}`);
      if (!sessionToken) {
        return res.sendStatus(204);
      }

      await Service.getInstance().redisClient.del(sessionToken);
      res.clearCookie('sessionToken', TOKEN_COOKIE_ATTRIBUTES);
      res.sendStatus(204);
    })
  );

  tenantRouter.get(
    '/signedin',
    Middlewares.asyncWrapper(async (req, res) => {
      const { token } = req.query;
      if (!token) {
        throw new ServiceError('invalid token', 401);
      }

      const email = await Service.getInstance().redisClient.get(token);
      if (!email) {
        throw new ServiceError(
          `email not found for token ${token}. Magic link already used`,
          401
        );
      }
      await Service.getInstance().redisClient.del(token);

      try {
        jwt.verify(token, RESET_TOKEN_SECRET);
      } catch (error) {
        throw new ServiceError(error, 401);
      }

      const account = { email, role: 'tenant' };
      const sessionToken = jwt.sign({ account }, ACCESS_TOKEN_SECRET, {
        expiresIn: PRODUCTION ? '30m' : '12h'
      });
      await Service.getInstance().redisClient.set(sessionToken, email);
      res.json({ sessionToken });
    })
  );

  tenantRouter.get(
    '/session',
    Middlewares.asyncWrapper(async (req, res) => {
      const sessionToken = req.cookies.sessionToken;
      if (!sessionToken) {
        throw new ServiceError('invalid token', 401);
      }

      const email = await Service.getInstance().redisClient.get(sessionToken);
      if (!email) {
        logger.error(`email not found for token ${sessionToken}`);
        throw new ServiceError('invalid token', 401);
      }

      try {
        jwt.verify(sessionToken, ACCESS_TOKEN_SECRET);
      } catch (error) {
        throw new ServiceError(error, 401);
      }

      return res.json({ email });
    })
  );

  return tenantRouter;
}
