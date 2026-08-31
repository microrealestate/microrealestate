import {
  Collections,
  DateFormat,
  logger,
  ServiceError
} from '@microrealestate/common';
import * as EmailAttachments from './emailattachments';
import * as EmailContent from './emailcontent';
import * as EmailData from './emaildata';
import * as EmailEngine from './emailengine';
import * as EmailRecipients from './emailrecipients';

export async function status(startTerm, endTerm) {
  const query = {};
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
  templateName,
  recordId,
  params
) {
  logger.info(`sending email for ${templateName} recordId: ${recordId}`);
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
    logger.error('error getting recipients:', error);
    throw new ServiceError(`missing recipients for ${templateName}`, 422);
  }

  if (!recipientsList?.length) {
    throw new ServiceError(`missing recipient list for ${templateName}`, 422);
  }

  if (recipientsList.some((r) => !r.to)) {
    throw new ServiceError(`missing recipient email for ${templateName}`, 422);
  }
  logger.debug(
    `recipients ${recipientsList
      .map(
        ({ from, to, replyTo }) =>
          `from: ${from}, to: ${to}, replyTo: ${replyTo}`
      )
      .join('|')}`
  );

  let attachments;
  try {
    logger.debug('add email attachments');
    attachments = await EmailAttachments.build(
      authorizationHeader,
      locale,
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

  const parallelResults = await Promise.all(
    recipientsList.map(async (recipients) => {
      const email = {
        ...recipients,
        ...content,
        ...attachments
      };
      logger.debug(
        `subject: ${email.subject} text size: ${email.text?.length || 0}chars html size: ${email.html?.length || 0}chars attachments: ${
          email.attachment?.length || 0
        }files`
      );

      let status;
      try {
        status = await EmailEngine.sendEmail(email, data);
        await new Collections.Email({
          templateName,
          recordId, // tenantId
          params,
          sentTo: recipients.to,
          sentDate: DateFormat.now()
        }).save();
        logger.info(`${templateName} sent to ${recordId} at ${recipients.to}`);
      } catch (exc) {
        logger.error(
          `${templateName} not sent to ${recordId} at ${recipients.to}`,
          exc
        );
        return null;
      }
      logger.debug(status);

      return {
        ...result,
        email: recipients.to,
        status
      };
    })
  );

  return parallelResults.filter((res) => res !== null);
}
