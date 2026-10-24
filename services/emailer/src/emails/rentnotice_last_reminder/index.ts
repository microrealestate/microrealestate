import type { API } from '@microrealestate/shared';
import { defineEmail } from '../../engine/types';
import { buildRentNoticeData, rentPdf } from '../shared/rent';

export default defineEmail({
  name: 'rentnotice_last_reminder',

  sender: 'landlord',

  onDemand: {
    refsFromRequest: async (
      recordId,
      { term }: API.Emailer.PostSendEmail.RentEmailParams
    ) => [{ recordId, params: { term: Number(term) } }]
  },

  data: buildRentNoticeData,
  attachments: rentPdf('rentnotice_last_reminder')
});
