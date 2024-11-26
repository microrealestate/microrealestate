import * as Attachments from './emailparts/attachments/index.js';

export async function build(
  authorizationHeader,
  locale,
  organizationId,
  templateName,
  recordId,
  params,
  data
) {
  return await Attachments.build(
    authorizationHeader,
    locale,
    organizationId,
    templateName,
    recordId,
    params,
    data
  );
}
