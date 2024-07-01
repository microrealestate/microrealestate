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
      `data not found to generate document invoice with id=${params.id}`
    );
  }

  let momentToday = moment();
  data.tenant.rents.forEach((rent) => {
    const momentTerm = moment(rent.term, 'YYYYMMDDHH');
    const endOfTerm = momentTerm.endOf(data.tenant.contract.lease.timeRange);
    if (momentToday.isAfter(endOfTerm, 'day')) {
      rent.documentDate = endOfTerm.format('DD/MM/YYYY');
    } else {
      rent.documentDate = momentToday.format('DD/MM/YYYY');
    }
  });

  data.cssUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'css', 'print.css'));
  data.logoUrl = fileUrl(path.join(TEMPLATES_DIRECTORY, 'img', 'logo.png'));

  return data;
}
