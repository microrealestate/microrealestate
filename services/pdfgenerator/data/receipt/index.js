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
      `data not found to generate document receipt with id=${params.id}`
    );
  }

  const momentToday = moment();
  data.tenant.rents.forEach((rent) => {
    const momentTerm = moment(rent.term, 'YYYYMMDDHH');
    const endOfTerm = momentTerm.endOf(data.tenant.contract.lease.timeRange);
    if (momentToday.isAfter(endOfTerm, 'day')) {
      rent.documentDate = endOfTerm.format(DateFormat.DATE_FORMAT);
    } else {
      rent.documentDate = momentToday.format(DateFormat.DATE_FORMAT);
    }
  });

  data.cssUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'css', 'print.css'));
  data.logoUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'img', 'logo.png'));

  return data;
}
