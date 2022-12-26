const moment = require('moment');
const rentcall = require('../rentcall');
const utils = require('../');

module.exports = {
  async get(params) {
    const data = await rentcall.get(params);

    const momentToday = moment();

    data.tenant.rents.forEach((rent) => {
      const momentTerm = moment(rent.term, 'YYYYMMDDHH');
      const endOfTerm = momentTerm.endOf(data.tenant.contract.lease.timeRange);
      if (momentToday.isAfter(endOfTerm, 'day')) {
        rent.documentDate = utils.avoidWeekend(endOfTerm).format('DD/MM/YYYY');
      } else {
        rent.documentDate = utils
          .avoidWeekend(momentToday)
          .format('DD/MM/YYYY');
      }
    });

    return data;
  },
};
