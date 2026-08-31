import {
  Crypto,
  formatError,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import express from 'express';
import locale from 'locale';
import * as EmailEngine from './emailengine';
import * as Emailer from './emailer';

async function _send(req, res) {
  const { templateName, recordId, params } = req.body;
  let allowedTemplates;
  switch (req.path) {
    case '/emailer/resetpassword':
      allowedTemplates = ['reset_password'];
      break;
    case '/emailer/otp':
      allowedTemplates = ['otp'];
      break;
    default:
      allowedTemplates = [
        'receipt',
        'rentnotice',
        'rentnotice_last_reminder',
        'rentnotice_reminder'
      ];
      break;
  }
  if (!allowedTemplates.includes(templateName)) {
    logger.warn(`template not found ${templateName}`);
    throw new ServiceError('template not found', 404);
  }

  // TODO: pass headers in params
  let results = [];
  try {
    results = await Emailer.send(
      req.headers.authorization,
      req.realm?.locale || req.rawLocale.code,
      req.realm?.currency || '',
      templateName,
      recordId,
      params
    );
  } catch (error) {
    logger.error(formatError(error));
    throw new ServiceError('email service not configured or not working', 422);
  }

  if (!results?.length) {
    throw new ServiceError(
      `no results returned by the email engine after sending the email ${templateName}`,
      500
    );
  }

  res.json(results);
}

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const apiRouter = express.Router();
  // parse locale
  apiRouter.use(locale(['fr-FR', 'en', 'pt-BR', 'de-DE', 'es-CO'], 'en')); // used when organization is not set
  apiRouter.post('/emailer/resetpassword', Middlewares.asyncWrapper(_send)); // allow this route even there is no access token
  apiRouter.post('/emailer/otp', Middlewares.asyncWrapper(_send)); // allow this route even there is no access token
  apiRouter.use(
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.checkOrganization(),
    Middlewares.onlyCallers(['landlord'])
  );

  //     recordId,      // DB record Id
  //     startTerm      // ex. { term: 2018030100 })
  //     endTerm        // ex. { term: 2018040100 })
  apiRouter.get(
    '/emailer/status/:startTerm/:endTerm?',
    Middlewares.asyncWrapper(async (req, res) => {
      const { startTerm, endTerm } = req.params;
      const result = await Emailer.status(
        Number(startTerm),
        endTerm ? Number(endTerm) : null
      );
      res.json(result);
    })
  );

  apiRouter.post(
    '/emailer/test-smtp',
    Middlewares.asyncWrapper(async (req, res) => {
      const stored = req.realm?.thirdParties?.smtp;
      const input = req.body?.smtp;
      const config = input
        ? {
            server: input.server ?? stored?.server,
            port: input.port ?? stored?.port,
            encryption: input.encryption ?? stored?.encryption,
            authentication: input.authentication ?? stored?.authentication,
            username: input.username ?? stored?.username,
            password:
              input.passwordUpdated && typeof input.password === 'string'
                ? Crypto.encrypt(input.password)
                : stored?.password
          }
        : stored;

      if (!config?.server) {
        throw new ServiceError(
          'the email service has not been configured',
          422
        );
      }
      try {
        await EmailEngine.verifyConnection(config);
      } catch (error) {
        logger.error(formatError(error));
        throw new ServiceError('SMTP connection failed', 502);
      }
      res.json({ status: 'ok' });
    })
  );

  // body = {
  //     templateName,  // email template name (receipt, rentnotice, rentnotice-reminder...)
  //     recordId,      // DB record Id
  //     params         // extra parameters (ex. { term: 2018030100 })
  // }
  apiRouter.post('/emailer', Middlewares.asyncWrapper(_send));

  return apiRouter;
}
