import {
  Collections,
  Crypto,
  formatError,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import {
  type API,
  type EmailName,
  INTERNAL_KEY_PURPOSES
} from '@microrealestate/shared';
import express from 'express';
import locale from 'locale';
import * as EmailEngine from './emailengine';
import { getOnDemandDefinition, onDemandNames } from './engine/registry';
import { send } from './engine/send';
import type { RunContext } from './engine/types';

type SendHandler = Middlewares.AsyncRequestHandler<
  API.Emailer.PostSendEmail.RequestParams,
  API.Emailer.PostSendEmail.ResponseBody,
  API.Emailer.PostSendEmail.RequestBody
>;

function _send(allowed: EmailName[]): SendHandler {
  return async (req, res) => {
    const { templateName, recordId, params } = req.body;

    if (!templateName || !allowed.includes(templateName)) {
      logger.warn(`template not found ${templateName}`);
      throw new ServiceError('template not found', 404);
    }

    const definition = getOnDemandDefinition(templateName);
    if (!definition) {
      throw new ServiceError('template not found', 404);
    }

    const ctx: RunContext = {
      realmId: String(req.realm?._id || ''),
      locale: req.realm?.locale || req.rawLocale.code,
      currency: req.realm?.currency || '',
      // Forwarded: the attachment step calls pdfgenerator on the caller's behalf.
      authorization: req.headers.authorization || ''
    };

    const results: Awaited<ReturnType<typeof send>>[] = [];
    try {
      const refs = await definition.onDemand.refsFromRequest(
        String(recordId),
        params
      );
      for (const ref of refs) {
        results.push(await send(definition, ref, ctx));
      }
    } catch (error) {
      logger.error(formatError(error as Error));
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'email service not configured or not working',
        422
      );
    }

    if (results.some(({ error }) => error)) {
      throw new ServiceError(
        `no results returned by the email engine after sending the email ${templateName}`,
        500
      );
    }

    res.json(
      results.flatMap(({ recipients, emailId }) =>
        recipients.map((email) => ({
          templateName,
          recordId,
          params,
          email,
          status: { id: emailId, message: 'sent' }
        }))
      )
    );
  };
}

export default function routes() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const apiRouter = express.Router();
  apiRouter.use(locale(['fr-FR', 'en', 'pt-BR', 'de-DE', 'es-CO'], 'en')); // used when organization is not set

  const needInternalKey = Middlewares.needInternalKey(
    ACCESS_TOKEN_SECRET,
    INTERNAL_KEY_PURPOSES.EMAILER_ROUTES
  );
  apiRouter.post(
    '/emailer/resetpassword',
    needInternalKey,
    Middlewares.asyncWrapper(_send(['reset_password']))
  );
  apiRouter.post(
    '/emailer/otp',
    needInternalKey,
    Middlewares.asyncWrapper(_send(['otp']))
  );

  apiRouter.use(
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.checkOrganization(),
    Middlewares.onlyCallers(['landlord'])
  );

  const getStatus: Middlewares.AsyncRequestHandler<
    API.Emailer.GetStatus.RequestParams,
    API.Emailer.GetStatus.ResponseBody
  > = async (req, res) => {
    const { startTerm, endTerm } = req.params;
    const result = await status(
      String(req.realm?._id ?? ''),
      Number(startTerm),
      endTerm ? Number(endTerm) : null
    );
    res.json(result);
  };
  apiRouter.get(
    '/emailer/status/:startTerm/:endTerm?',
    Middlewares.asyncWrapper(getStatus)
  );

  const testSmtp: Middlewares.AsyncRequestHandler<
    API.Emailer.PostTestSmtp.RequestParams,
    API.Emailer.PostTestSmtp.ResponseBody,
    API.Emailer.PostTestSmtp.RequestBody
  > = async (req, res) => {
    const stored = req.realm?.thirdParties?.smtp;
    const input = req.body?.smtp;
    const sameDestination =
      (input?.server ?? stored?.server) === stored?.server &&
      (input?.username ?? stored?.username) === stored?.username;
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
              : sameDestination
                ? stored?.password
                : undefined
        }
      : stored;

    if (!config?.server) {
      throw new ServiceError('the email service has not been configured', 422);
    }
    if (config.authentication && !config.password) {
      throw new ServiceError(
        'enter the password to test a different server or account',
        422
      );
    }
    logger.info(
      `smtp connection test for realm ${req.realm?._id} to ${config.server}:${config.port}`
    );

    try {
      await EmailEngine.verifyConnection(config);
    } catch (error) {
      logger.error(formatError(error as Error));
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('SMTP connection failed', 502);
    }
    res.json({ status: 'ok' });
  };
  apiRouter.post('/emailer/test-smtp', Middlewares.asyncWrapper(testSmtp));

  apiRouter.post(
    '/emailer',
    Middlewares.asyncWrapper(_send(onDemandNames('accessToken')))
  );

  return apiRouter;
}

async function status(
  realmId: string,
  startTerm: number,
  endTerm: number | null
) {
  const query: Record<string, unknown> = { realmId, status: 'sent' };
  if (startTerm && endTerm) {
    query.$and = [
      { 'params.term': { $gte: startTerm } },
      { 'params.term': { $lte: endTerm } }
    ];
  } else if (startTerm) {
    query['params.term'] = startTerm;
  }

  return await Collections.Email.find(
    query,
    {
      _id: false,
      templateName: true,
      recordId: true,
      params: true,
      sentTo: true,
      sentDate: true
    },
    { sort: { sentDate: -1 } }
  ).lean();
}
