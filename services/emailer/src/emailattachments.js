import * as Attachments from './emailparts/attachments';

export async function build(
  authorizationHeader,
  locale,
  templateName,
  recordId,
  params,
  data
) {
  return await Attachments.build(
    authorizationHeader,
    locale,
    templateName,
    recordId,
    params,
    data
  );
}
