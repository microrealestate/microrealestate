import * as Emailer from './emailer.js';
// eslint-disable-next-line import/no-unresolved
import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';
import locale from 'locale';
import logger from 'winston';

async function _send(req, res) {
  try {
    const { templateName, recordId, params } = req.body;
    let allowedTemplates;
    switch (req.path) {
      case '/emailer/resetpassword':
        allowedTemplates = ['reset_password'];
        break;
      case '/emailer/magiclink':
        allowedTemplates = ['magic_link'];
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
      return res.sendStatus(404);
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
      logger.warn(
        `no results returned by the email engine after sending the email ${templateName}`
      );
      return res.sendStatus(404);
    }

    if (results.length === 1 && results[0].error) {
      logger.error(results);
      return res.status(results[0].error.status).json(results[0].error);
    }

    res.json(results);
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      status: 500,
      message: 'unexpected error occured when sending the email'
    });
  }
}

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const apiRouter = express.Router();
  // parse locale
  apiRouter.use(locale(['fr-FR', 'en', 'pt-BR', 'de-DE'], 'en')); // used when organization is not set
  apiRouter.post('/emailer/resetpassword', _send); // allow this route even there is no access token
  apiRouter.post('/emailer/magiclink', _send); // allow this route even there is no access token
  apiRouter.use(
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.checkOrganization(),
    Middlewares.notRoles(['tenant'])
  );

  //     recordId,      // DB record Id
  //     startTerm      // ex. { term: 2018030100 })
  //     endTerm        // ex. { term: 2018040100 })
  apiRouter.get('/emailer/status/:startTerm/:endTerm?', async (req, res) => {
    try {
      const { startTerm, endTerm } = req.params;
      const result = await Emailer.status(
        null,
        Number(startTerm),
        endTerm ? Number(endTerm) : null
      );
      res.json(result);
    } catch (error) {
      logger.error(error);
      res.status(500).send({
        status: 500,
        message: error.message
      });
    }
  });

  // body = {
  //     templateName,  // email template name (invoice, rentcall, rentcall-reminder...)
  //     recordId,      // DB record Id
  //     params         // extra parameters (ex. { term: 2018030100 })
  // }
  apiRouter.post('/emailer', _send);

  return apiRouter;
}
