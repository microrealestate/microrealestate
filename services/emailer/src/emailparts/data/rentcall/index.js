const moment = require('moment');
const invoice = require('../invoice');

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
  get: async (tenantId, params) => {
    const momentTerm = moment(params.term, 'YYYYMMDDHH');
    const momentToday = moment();

    const { landlord, tenant, period } = await invoice.get(tenantId, params);
    const beginDate = moment(tenant.contract.beginDate);

    let dueDate = moment(momentTerm);
    if (tenant.contract.lease.timeRange === 'years') {
      dueDate.add(1, 'months');
    } else if (tenant.contract.lease.timeRange === 'months') {
      dueDate.add(10, 'days');
    } else if (tenant.contract.lease.timeRange === 'weeks') {
      dueDate.add(2, 'days');
    }
    _avoidWeekend(dueDate);
    if (dueDate.isBefore(beginDate)) {
      dueDate = moment(beginDate);
    }

    let billingDay = momentToday;
    if (dueDate.isSameOrBefore(momentToday)) {
      billingDay = _avoidWeekend(moment(momentTerm));
    }

    // data that will be injected in the email content files (ejs files)
    return {
      landlord,
      tenant,
      period,
      today: billingDay.format('DD/MM/YYYY'),
      billingRef: `${moment(params.term, 'YYYYMMDDHH').format('MM_YY')}_${
        tenant.reference
      }`,
      dueDate: dueDate.format('DD/MM/YYYY'),
    };
  },
};
