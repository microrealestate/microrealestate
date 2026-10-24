import { Collections } from '@microrealestate/common';
import type { API, RealmType, TenantType } from '@microrealestate/shared';
import { defineEmail, type EmailRef } from '../../engine/types';
import { toLandlordData } from '../shared/landlord';

export default defineEmail({
  name: 'otp',

  sender: 'app',

  onDemand: {
    refsFromRequest: async (
      recordId,
      { otp }: API.Emailer.PostSendEmail.OtpEmailParams
    ) => [{ recordId, otp: String(otp) }]
  },

  data: buildOtpData
});

async function buildOtpData({
  recordId: email,
  otp
}: EmailRef & { otp: string }) {
  const tenant = (await Collections.Tenant.findOne({
    'contacts.email': email
  })
    .populate('realmId')
    .lean()) as TenantType<RealmType> | null;

  if (!tenant) {
    throw new Error('email not found as tenant contact');
  }

  return { email, landlord: toLandlordData(tenant.realmId as RealmType), otp };
}
