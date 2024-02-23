import * as rentcall from '../rentcall/index.js';
import * as utils from '../index.js';
import moment from 'moment';

export async function get(params) {
  const data = await rentcall.get(params);

  const momentToday = moment();
  data.tenant.rents.forEach((rent) => {
    rent.documentDate = utils.avoidWeekend(momentToday).format('DD/MM/YYYY');
  });

  return data;
}
