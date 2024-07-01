// eslint-disable-next-line import/no-unresolved
import { Collections } from '@microrealestate/common';

export async function get(email, params) {
  const dbAccount = await Collections.Account.findOne({ email });
  if (!dbAccount) {
    throw new Error('user not found');
  }

  const account = dbAccount.toObject();

  // data that will be injected in the email content files (ejs files)
  return {
    firstname: account.firstname,
    token: params.token,
    useAppEmailService: true
  };
}
