const Tenant = require('@microrealestate/common/models/tenant');

module.exports = {
  get: async (email, params) => {
    // Get the first landlord that has the email in the contacts
    const dbTenant = await Tenant.findOne({ 'contacts.email': email }).populate(
      'realmId'
    );
    if (!dbTenant) {
      throw new Error('email not found as tenant contact');
    }

    const landlord = dbTenant.realmId.toObject();

    // data that will be injected in the email content files (ejs files)
    return {
      landlord,
      token: params.token,
      useAppEmailService: true,
    };
  },
};
