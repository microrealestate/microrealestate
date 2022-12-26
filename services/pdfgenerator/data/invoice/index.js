const moment = require('moment');
const path = require('path');
const fileUrl = require('file-url');
const utils = require('../');
const config = require('../../src/config');

const template_dir = config.TEMPLATES_DIRECTORY;

module.exports = {
  async get(params) {
    const data = await utils.getRentsData(params);

    if (!data || !data.tenant || !data.tenant.rents) {
      throw new Error(
        `data not found to generate document invoice with id=${params.id}`
      );
    }

    let momentToday = moment();
    data.tenant.rents.forEach((rent) => {
      const momentTerm = moment(rent.term, 'YYYYMMDDHH');
      const endOfTerm = momentTerm.endOf(data.tenant.contract.lease.timeRange);
      if (momentToday.isAfter(endOfTerm, 'day')) {
        rent.documentDate = endOfTerm.format('DD/MM/YYYY');
      } else {
        rent.documentDate = momentToday.format('DD/MM/YYYY');
      }
    });

    data.cssUrl = fileUrl(path.join(template_dir, 'css', 'print.css'));
    data.logoUrl = fileUrl(path.join(template_dir, 'img', 'logo.png'));

    return data;
  },
};
