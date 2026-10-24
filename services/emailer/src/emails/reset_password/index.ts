import { Collections } from '@microrealestate/common';
import type { AccountType, API, RealmType } from '@microrealestate/shared';
import { defineEmail, type EmailRef } from '../../engine/types';
import { appUrl, toLandlordData } from '../shared/landlord';

export default defineEmail({
  name: 'reset_password',

  sender: 'app',

  onDemand: {
    refsFromRequest: async (
      recordId,
      { token }: API.Emailer.PostSendEmail.ResetPasswordEmailParams
    ) => [{ recordId, token: String(token) }]
  },

  data: buildResetPasswordData
});

async function buildResetPasswordData({
  recordId: email,
  token
}: EmailRef & { token: string }) {
  const account = (await Collections.Account.findOne({
    email
  }).lean()) as AccountType | null;

  if (!account) {
    throw new Error('user not found');
  }

  const realm = (await Collections.Realm.findOne(
    {}
  ).lean()) as RealmType | null;
  if (!realm) {
    throw new Error('organization not found');
  }

  return {
    email,
    landlord: toLandlordData(realm),
    firstname: account.firstname,
    token,
    resetUrl: appUrl(realm, `/landlord/resetpassword/${token}`)
  };
}
