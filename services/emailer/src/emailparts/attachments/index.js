import fs from 'node:fs';
import { formatError, logger } from '@microrealestate/common';
import i18n from 'i18n';
import moment from 'moment';
import fetchPDF from './fetchpdf';

export async function build(
  authorizationHeader,
  locale,
  templateName,
  recordId,
  params,
  { tenant }
) {
  if (
    ![
      'receipt',
      'rentnotice',
      'rentnotice_last_reminder',
      'rentnotice_reminder'
    ].includes(templateName)
  ) {
    return {
      attachment: []
    };
  }

  i18n.setLocale(locale);
  const billingRef = `${moment(params.term, 'YYYYMMDDHH')
    .locale(locale)
    .format('MM_YY')}_${tenant.reference}`;
  const filename = `${i18n.__(templateName)}-${tenant.name}-${billingRef}.pdf`;
  const filePath = await fetchPDF(
    authorizationHeader,
    templateName,
    recordId,
    params,
    filename
  );
  const data = fs.readFileSync(filePath);
  try {
    fs.rmSync(filePath, { force: true });
  } catch (error) {
    logger.error(formatError(error));
  }
  return {
    attachment: [
      {
        filename,
        data
      }
    ]
  };
}
