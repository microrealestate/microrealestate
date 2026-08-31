import path from 'node:path';
import { DateFormat } from '@microrealestate/common';
import fileUrl from 'file-url';
import moment from 'moment';
import { TEMPLATES_DIRECTORY } from '../../src/directories';
import * as utils from '../';

export async function get(params) {
  const data = await utils.getRentsData(params);

  if (!data?.tenant?.rents) {
    throw new Error(
      `data not found to generate document rentnotice with id=${params.id}`
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
    rent.dueDate = dueDate.format(DateFormat.DATE_FORMAT);
    rent.documentDate = momentToday.format(DateFormat.DATE_FORMAT);
    if (momentToday.isAfter(dueDate)) {
      rent.documentDate = dueDate.format(DateFormat.DATE_FORMAT);
    }
  });

  data.cssUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'css', 'print.css'));
  data.logoUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'img', 'logo.png'));
  return data;
}
