const moment = require('moment');
const path = require('path');
const fileUrl = require('file-url');
const db = require('../');
const config = require('../../src/config');

const template_dir = config.TEMPLATES_DIRECTORY;

const _avoidWeekend = (aMoment) => {
  const day = aMoment.isoWeekday();
  if (day === 6) {
    // if saturday shift the due date to friday
    aMoment.subtract(1, 'days');
  } else if (day === 7) {
    // if sunday shift the due date to monday
    aMoment.add(1, 'days');
  }
  return aMoment;
};

module.exports = {
  async get(params) {
    const data = await db.getRentsData(params);

    if (!data || !data.tenant || !data.tenant.rents) {
      throw new Error(
        `data not found to generate document rentcall with id=${params.id}`
      );
    }

    const momentToday = moment();
    const momentTerm = moment(params.term, 'YYYYMMDDHH');
    const beginDate = moment(data.tenant.contract.beginDate);

    let dueDate = moment(momentTerm);
    if (data.tenant.contract.lease.timeRange === 'years') {
      dueDate.add(1, 'months');
    } else if (data.tenant.contract.lease.timeRange === 'months') {
      dueDate.add(10, 'days');
    } else if (data.tenant.contract.lease.timeRange === 'weeks') {
      dueDate.add(2, 'days');
    }
    _avoidWeekend(dueDate);
    if (dueDate.isBefore(beginDate)) {
      dueDate = moment(beginDate);
    }

    data.today = momentToday.format('DD/MM/YYYY');
    if (dueDate.isSameOrBefore(momentToday)) {
      data.today = _avoidWeekend(moment(momentTerm)).format('DD/MM/YYYY');
    }
    data.tenant.rents.forEach((rent) => {
      rent.dueDate = dueDate.format('DD/MM/YYYY');
    });

    data.cssUrl = fileUrl(path.join(template_dir, 'css', 'print.css'));
    data.logoUrl = fileUrl(path.join(template_dir, 'img', 'logo.png'));
    return data;
  },
};
