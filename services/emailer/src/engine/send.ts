import {
  Collections,
  DateFormat,
  formatError,
  hashEmail,
  logger
} from '@microrealestate/common';
import * as EmailEngine from '../emailengine';
import { render } from './render';
import { envelopeFor, transportFor } from './senders';
import type {
  Attachment,
  EmailDefinition,
  EmailRef,
  Envelope,
  RunContext,
  SendResult
} from './types';

export async function send(
  definition: EmailDefinition,
  ref: EmailRef,
  ctx: RunContext
): Promise<SendResult> {
  const data = await definition.data(ref, ctx);

  const envelope: Envelope = envelopeFor(definition.sender, data);
  if (!envelope.to?.length && !envelope.bcc?.length) {
    throw new Error(`no recipient for ${definition.name}`);
  }
  if (!envelope.from) {
    throw new Error(`no sender configured for ${definition.name}`);
  }

  const attachments: Attachment[] = definition.attachments
    ? await definition.attachments(data, ctx)
    : [];

  const content = render(definition.name, data, ctx.locale, ctx.currency);

  const transport = transportFor(definition.sender, data);

  const recipients = [...(envelope.to ?? []), ...(envelope.bcc ?? [])];
  const { recordId, params = {} } = ref;
  const row = {
    ...(ctx.realmId ? { realmId: ctx.realmId } : {}),
    templateName: definition.name,
    recordId,
    params,
    sentTo: recipients
  };

  const loggedRecipients = recipients.map(hashEmail).join(',');

  logger.debug(
    `${definition.name} to ${loggedRecipients} text ${content.text.length}chars html ${content.html.length}chars attachments ${attachments.length}files`
  );

  try {
    const status = await EmailEngine.sendEmail(
      { envelope, ...content, attachments },
      transport
    );

    await new Collections.Email({
      ...row,
      status: 'sent',
      sentDate: DateFormat.now(),
      emailId: status.id
    }).save();

    logger.info(`${definition.name} sent to ${loggedRecipients}`);
    return { name: definition.name, recipients, emailId: status.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // `GET /emailer/status` filters these out, so a failure never counts as delivered.
    await new Collections.Email({
      ...row,
      status: 'failed',
      error: message
    }).save();

    logger.error(
      `${definition.name} not sent to ${loggedRecipients}`,
      formatError(error)
    );
    return { name: definition.name, recipients, error: message };
  }
}
