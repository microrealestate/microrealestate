import * as EmailAttachments from './emailattachments.js';
import * as EmailContent from './emailcontent.js';
import * as EmailData from './emaildata.js';
import * as EmailEngine from './emailengine.js';
import * as EmailRecipients from './emailrecipients.js';
import {
  Collections,
  logger,
  Service,
  ServiceError
} from '@microrealestate/common';

export async function status(recordId, startTerm, endTerm) {
  const query = {};
  if (recordId) {
    query.recordId = recordId;
  }
  if (startTerm && endTerm) {
    query.$and = [
      { 'params.term': { $gte: startTerm } },
      { 'params.term': { $lte: endTerm } }
    ];
  } else if (startTerm) {
    query.params = {
      term: startTerm
    };
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

// TODO: pass some args in params
export async function send(
  authorizationHeader, // Bearer accessToken
  locale,
  currency,
  organizationId,
  templateName,
  recordId,
  params
) {
  const { ALLOW_SENDING_EMAILS } = Service.getInstance().envConfig.getValues();
  const result = {
    templateName,
    recordId,
    params
  };

  let data;
  try {
    logger.debug('fetch email data');
    data = await EmailData.build(templateName, recordId, params);
  } catch (error) {
    logger.error('error getting email data:', error);
    throw new ServiceError(
      `no data found for ${templateName} recordId: ${recordId}`,
      404
    );
  }
  logger.debug(data);

  let recipientsList;
  if (ALLOW_SENDING_EMAILS) {
    try {
      logger.debug('get email recipients');
      recipientsList = await EmailRecipients.build(
        locale,
        templateName,
        recordId,
        params,
        data
      );
    } catch (error) {
      logger.error('error getting recipients:', error);
      throw new ServiceError(`missing recipients for ${templateName}`, 422);
    }

    if (!recipientsList?.length) {
      throw new ServiceError(`missing recipient list for ${templateName}`, 422);
    }

    if (recipientsList.some((r) => !r.to)) {
      throw new ServiceError(
        `missing recipient email for ${templateName}`,
        422
      );
    }
    logger.debug(recipientsList);
  } else {
    recipientsList = [{ to: 'test@example.com' }];
  }

  let attachments;
  try {
    logger.debug('add email attachments');
    attachments = await EmailAttachments.build(
      authorizationHeader,
      locale,
      organizationId,
      templateName,
      recordId,
      params,
      data
    );
  } catch (error) {
    logger.error('error getting attachments:', error);
    throw new ServiceError(`attachment not found ${templateName}`, 404);
  }

  let content;
  try {
    logger.debug('get email content');
    content = await EmailContent.build(
      locale,
      currency,
      templateName,
      recordId,
      params,
      data
    );
  } catch (error) {
    logger.error('error getting content:', error);
    throw new ServiceError(`missing content for ${templateName}`, 422);
  }

  return await Promise.all(
    recipientsList.map(async (recipients) => {
      const email = {
        ...recipients,
        ...content,
        ...attachments
      };
      logger.debug(`recipients:
${email.to}
subject:
${email.subject} 
text:
${email.text}
html:
${email.html} 
attachments:
${email.attachment
  .map((a) => `${a.filename} size: ${a.data?.length || 0}`)
  .join('\n')}`);

      let status;
      if (ALLOW_SENDING_EMAILS) {
        status = await EmailEngine.sendEmail(email, data);
        new Collections.Email({
          templateName,
          recordId, // tenantId
          params,
          sentTo: recipients.to,
          sentDate: new Date(),
          emailId: status.id,
          status: 'queued'
        }).save();
        logger.info(`${templateName} sent to ${recordId} at ${recipients.to}`);
      } else {
        const message = `ALLOW_SENDING_EMAILS set to "false", ${templateName} not sent to ${recordId} at ${recipients.to}`;
        status = {
          id: '<devid>',
          to: email.to,
          message
        };
        logger.warn(message);
      }
      logger.debug(status);

      return {
        ...result,
        email: recipients.to,
        status
      };
    })
  );
}
