import type { API } from '@microrealestate/shared';
import { defineEmail } from '../../engine/types';
import { appUrl } from '../shared/landlord';
import { buildRentData, rentPdf } from '../shared/rent';

export default defineEmail({
  name: 'receipt',

  sender: 'landlord',

  onDemand: {
    refsFromRequest: async (
      recordId,
      { term }: API.Emailer.PostSendEmail.RentEmailParams
    ) => [{ recordId, params: { term: Number(term) } }]
  },

  data: async (ref, ctx) => {
    const data = await buildRentData(ref, ctx);
    return {
      ...data,
      receiptsLink: appUrl(data.landlord, '/tenant/noticesandreceipts')
    };
  },
  attachments: rentPdf('receipt')
});
