import fetchPDF from '../fetchpdf.js';
import fs from 'fs';
import i18n from '../locale/index.js';
import moment from 'moment';

export async function get(
  authorizationHeader,
  locale,
  organizationId,
  recordId,
  params,
  { tenant }
) {
  const billingRef = `${moment(params.term, 'YYYYMMDDHH')
    .locale(locale)
    .format('MM_YY')}_${tenant.reference}`;
  const messages = await i18n(locale);
  const filename = `${messages['short_rentcall']}-${
    tenant.name
  }-${billingRef}.pdf`;
  const filePath = await fetchPDF(
    authorizationHeader,
    organizationId,
    'rentcall',
    recordId,
    params,
    filename
  );
  const data = fs.readFileSync(filePath);
  return {
    attachment: [
      {
        filename,
        data,
      },
    ],
  };
}