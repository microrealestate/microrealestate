import { DateFormat } from '@microrealestate/common';
import moment from 'moment';
import * as utils from '../';
import * as rentnotice from '../rentnotice';

export async function get(params) {
  const data = await rentnotice.get(params);

  const momentToday = moment();
  data.tenant.rents.forEach((rent) => {
    rent.documentDate = utils
      .avoidWeekend(momentToday)
      .format(DateFormat.DATE_FORMAT);
  });

  return data;
}
