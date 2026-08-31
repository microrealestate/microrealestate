import { Collections } from '@microrealestate/common';

export async function get(email, params) {
  const dbAccount = await Collections.Account.findOne({ email })?.lean();
  if (!dbAccount) {
    throw new Error('user not found');
  }

  const realm = await Collections.Realm.findOne({}).lean();
  if (!realm?.webServer?.domain) {
    throw new Error('app domain not configured');
  }

  const scheme = realm.webServer.httpsEnabled ? 'https' : 'http';
  const resetUrl = `${scheme}://${realm.webServer.domain}/landlord/resetpassword/${params.token}`;

  return {
    landlord: realm,
    firstname: dbAccount.firstname,
    token: params.token,
    resetUrl
  };
}
