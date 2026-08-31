import { DateFormat } from '@microrealestate/common';
import moment from 'moment';
import * as Receipt from '../receipt';

function _avoidWeekend(aMoment) {
  const day = aMoment.isoWeekday();
  if (day === 6) {
    // if saturday shift the due date to friday
    aMoment.subtract(1, 'days');
  } else if (day === 7) {
    // if sunday shift the due date to monday
    aMoment.add(1, 'days');
  }
  return aMoment;
}

export async function get(tenantId, params) {
  const momentTerm = moment(params.term, 'YYYYMMDDHH');
  const momentToday = moment();

  const { landlord, tenant, period } = await Receipt.get(tenantId, params);
  const beginDate = moment(tenant.contract.beginDate, DateFormat.DATE_FORMAT);

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
    today: billingDay.format(DateFormat.DATE_FORMAT),
    billingRef: `${moment(params.term, 'YYYYMMDDHH').format('MM_YY')}_${
      tenant.reference
    }`,
    dueDate: dueDate.format(DateFormat.DATE_FORMAT)
  };
}
