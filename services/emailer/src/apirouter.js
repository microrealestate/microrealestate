const express = require('express');
const locale = require('locale');
const logger = require('winston');
const {
  needAccessToken,
  checkOrganization,
} = require('@mre/common/utils/middlewares');
const emailer = require('./emailer');
const config = require('./config');

const _send = async (req, res) => {
  try {
    const { templateName, recordId, params } = req.body;
    const allowedTemplates =
      req.path === '/emailer/resetpassword'
        ? ['reset_password']
        : [
            'invoice',
            'rentcall',
            'rentcall_last_reminder',
            'rentcall_reminder',
          ];
    if (!allowedTemplates.includes(templateName)) {
      logger.warn(`template not found ${templateName}`);
      return res.sendStatus(404);
    }

    // TODO: pass headers in params
    const results = await emailer.send(
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
      message: 'unexpected error occured when sending the email',
    });
  }
};

const apiRouter = express.Router();
// parse locale
apiRouter.use(locale(['fr-FR', 'en', 'pt-BR', 'de-DE'], 'en')); // used when organization is not set
apiRouter.post('/emailer/resetpassword', _send); // allow this route even there is no access token
apiRouter.use(needAccessToken(config.ACCESS_TOKEN_SECRET));
apiRouter.use(checkOrganization());

//     recordId,      // DB record Id
//     startTerm      // ex. { term: 2018030100 })
//     endTerm        // ex. { term: 2018040100 })
apiRouter.get('/emailer/status/:startTerm/:endTerm?', async (req, res) => {
  try {
    const { startTerm, endTerm } = req.params;
    const result = await emailer.status(
      null,
      Number(startTerm),
      endTerm ? Number(endTerm) : null
    );
    res.json(result);
  } catch (error) {
    logger.error(error);
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
});

// body = {
//     templateName,  // email template name (invoice, rentcall, rentcall-reminder...)
//     recordId,      // DB record Id
//     params         // extra parameters (ex. { term: 2018030100 })
// }
apiRouter.post('/emailer', _send);

module.exports = apiRouter;
