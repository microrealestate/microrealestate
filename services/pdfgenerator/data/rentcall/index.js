import * as utils from '../index.js';
import fileUrl from 'file-url';
import moment from 'moment';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import { Service } from '@microrealestate/common';

export async function get(params) {
  const { TEMPLATES_DIRECTORY } = Service.getInstance().envConfig.getValues();
  const data = await utils.getRentsData(params);

  if (!data || !data.tenant || !data.tenant.rents) {
    throw new Error(
      `data not found to generate document rentcall with id=${params.id}`
    );
  }

  const momentToday = moment();
  const beginDate = moment(data.tenant.contract.beginDate);

  data.tenant.rents.forEach((rent) => {
    let dueDate = moment(rent.term, 'YYYYMMDDHH');
    if (data.tenant.contract.lease.timeRange === 'years') {
      dueDate.add(1, 'months');
    } else if (data.tenant.contract.lease.timeRange === 'months') {
      dueDate.add(10, 'days');
    } else if (data.tenant.contract.lease.timeRange === 'weeks') {
      dueDate.add(2, 'days');
    }
    utils.avoidWeekend(dueDate);
    if (dueDate.isBefore(beginDate)) {
      dueDate = moment(beginDate);
    }
    rent.dueDate = dueDate.format('DD/MM/YYYY');
    rent.documentDate = momentToday.format('DD/MM/YYYY');
    if (momentToday.isAfter(dueDate)) {
      rent.documentDate = dueDate.format('DD/MM/YYYY');
    }
  });

  data.cssUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'css', 'print.css'));
  data.logoUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'img', 'logo.png'));
  return data;
}
