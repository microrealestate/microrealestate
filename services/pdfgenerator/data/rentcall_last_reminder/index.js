const moment = require('moment');
const rentcall = require('../rentcall');
const utils = require('../');

module.exports = {
  async get(params) {
    const data = await rentcall.get(params);

    const momentToday = moment();
    data.tenant.rents.forEach((rent) => {
      rent.documentDate = utils.avoidWeekend(momentToday).format('DD/MM/YYYY');
    });

    return data;
  },
};
