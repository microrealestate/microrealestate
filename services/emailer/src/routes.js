import * as Emailer from './emailer.js';
import {
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import express from 'express';
import locale from 'locale';

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
        'invoice',
        'rentcall',
        'rentcall_last_reminder',
        'rentcall_reminder'
      ];
      break;
  }
  if (!allowedTemplates.includes(templateName)) {
    logger.warn(`template not found ${templateName}`);
    throw new ServiceError('template not found', 404);
  }

  // TODO: pass headers in params
  const results = await Emailer.send(
    req.headers.authorization,
    req.realm?.locale || req.rawLocale.code,
    req.realm?.currency || '',
    req.realm?._id || req.headers.organizationid,
    templateName,
    recordId,
    params
  );

  if (!results || !results.length) {
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
    Middlewares.notRoles(['tenant'])
  );

  //     recordId,      // DB record Id
  //     startTerm      // ex. { term: 2018030100 })
  //     endTerm        // ex. { term: 2018040100 })
  apiRouter.get(
    '/emailer/status/:startTerm/:endTerm?',
    Middlewares.asyncWrapper(async (req, res) => {
      const { startTerm, endTerm } = req.params;
      const result = await Emailer.status(
        null,
        Number(startTerm),
        endTerm ? Number(endTerm) : null
      );
      res.json(result);
    })
  );

  // body = {
  //     templateName,  // email template name (invoice, rentcall, rentcall-reminder...)
  //     recordId,      // DB record Id
  //     params         // extra parameters (ex. { term: 2018030100 })
  // }
  apiRouter.post('/emailer', Middlewares.asyncWrapper(_send));

  return apiRouter;
}
