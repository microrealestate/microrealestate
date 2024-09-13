import {
  Collections,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import axios from 'axios';
import { customAlphabet } from 'nanoid';
import express from 'express';
import jwt from 'jsonwebtoken';

const nanoid = customAlphabet('0123456789', 6);

export default function () {
  const {
    EMAILER_URL,
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

      if (email.includes(';') || email.includes('=')) {
        // ; and = are needed as separators in the redis payload
        logger.error('email contains unsupported characters');
        throw new ServiceError('unsupported email', 422);
      }

      const tenants = await Collections.Tenant.find({
        'contacts.email': email
      });
      if (!tenants.length) {
        logger.info(`login failed for ${email} tenant not found`);
        return res.sendStatus(204);
      }

      const otp = nanoid();
      const now = new Date();
      const createdAt = now.getTime();
      const expiresAt = createdAt + 5 * 60 * 1000; // 5m
      await Service.getInstance().redisClient.set(
        otp,
        `createdAt=${createdAt};expiresAt=${expiresAt};email=${email}`
      );

      logger.debug(
        `create a new OTP ${otp} for email ${email} and domain ${req.hostname}`
      );

      // send email
      await axios.post(
        `${EMAILER_URL}/otp`,
        {
          templateName: 'otp',
          recordId: email,
          params: {
            otp
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
      const { otp } = req.query;
      if (!otp) {
        throw new ServiceError('invalid otp', 401);
      }

      const rawPayload = await Service.getInstance().redisClient.get(otp);
      if (!rawPayload) {
        throw new ServiceError(
          `email not found for otp ${otp}. Code already used`,
          401
        );
      }
      await Service.getInstance().redisClient.del(otp);

      const payload = rawPayload.split(';').reduce((acc, rawValue) => {
        const [key, value] = rawValue.split('=');
        if (key) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const now = new Date().getTime();
      const expiresAt = Number(payload.expiresAt) || 0;
      if (now > expiresAt) {
        logger.debug(`otp ${otp} has expired`);
        throw new ServiceError('invalid otp', 401);
      }

      const account = { email: payload.email, role: 'tenant' };
      const sessionToken = jwt.sign({ account }, ACCESS_TOKEN_SECRET, {
        expiresIn: PRODUCTION ? '30m' : '12h'
      });
      await Service.getInstance().redisClient.set(sessionToken, payload.email);
      res.cookie('sessionToken', sessionToken, TOKEN_COOKIE_ATTRIBUTES);
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
