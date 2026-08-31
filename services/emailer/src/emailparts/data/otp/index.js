import { Collections } from '@microrealestate/common';

export async function get(email, params) {
  // Get the first landlord that has the email in the contacts
  const dbTenant = await Collections.Tenant.findOne({
    'contacts.email': email
  })
    .populate('realmId')
    ?.lean();
  if (!dbTenant) {
    throw new Error('email not found as tenant contact');
  }

  const landlord = dbTenant.realmId;

  // data that will be injected in the email content files (ejs files)
  return {
    landlord,
    otp: params.otp
  };
}
