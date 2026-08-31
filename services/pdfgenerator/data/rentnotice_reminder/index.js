import { DateFormat } from '@microrealestate/common';
import moment from 'moment';
import * as utils from '../';
import * as rentnotice from '../rentnotice';

export async function get(params) {
  const data = await rentnotice.get(params);

  const momentToday = moment();

  data.tenant.rents.forEach((rent) => {
    const momentTerm = moment(rent.term, 'YYYYMMDDHH');
    const endOfTerm = momentTerm.endOf(data.tenant.contract.lease.timeRange);
    if (momentToday.isAfter(endOfTerm, 'day')) {
      rent.documentDate = utils
        .avoidWeekend(endOfTerm)
        .format(DateFormat.DATE_FORMAT);
    } else {
      rent.documentDate = utils
        .avoidWeekend(momentToday)
        .format(DateFormat.DATE_FORMAT);
    }
  });

  return data;
}
