import * as EmailAttachments from './emailattachments.js';
import * as EmailContent from './emailcontent.js';
import * as EmailData from './emaildata.js';
import * as EmailEngine from './emailengine.js';
import * as EmailRecipients from './emailrecipients.js';
// eslint-disable-next-line import/no-unresolved
import { Collections, Service } from '@microrealestate/common';
import logger from 'winston';

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
  );
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
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 404,
          message: `no data found for ${templateName} recordId: ${recordId}`
        }
      }
    ];
  }
  logger.debug(data);

  let recipientsList;
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
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 422,
          message: `cannot get recipients for ${templateName}`
        }
      }
    ];
  }
  logger.debug(recipientsList);

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
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 404,
          message: `cannot add attachments for ${templateName}`
        }
      }
    ];
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
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 422,
          message: `cannot get email content for ${templateName}`
        }
      }
    ];
  }

  return await Promise.all(
    recipientsList.map(async (recipients) => {
      if (!recipients.to) {
        return {
          ...result,
          error: {
            status: 422,
            message: 'email not set'
          }
        };
      }

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
