const fs = require('fs');
const moment = require('moment');
const i18n = require('../locale');
const fetchPDF = require('../fetchpdf');

module.exports = {
  get: async (
    authorizationHeader,
    locale,
    organizationId,
    recordId,
    params,
    { tenant }
  ) => {
    const billingRef = `${moment(params.term, 'YYYYMMDDHH')
      .locale(locale)
      .format('MM_YY')}_${tenant.reference}`;
    const filename = `${i18n(locale)['short_rentcall']}-${
      tenant.name
    }-${billingRef}`;
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
  },
};
