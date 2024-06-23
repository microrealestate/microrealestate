// eslint-disable-next-line import/no-unresolved
import { Collections } from '@microrealestate/common';
import moment from 'moment';

export async function get(tenantId, params) {
  const dbTenant = await Collections.Tenant.findOne({ _id: tenantId })
    .populate('realmId')
    .populate('leaseId')
    .populate('properties.propertyId');
  if (!dbTenant) {
    throw new Error('tenant not found');
  }

  if (!dbTenant.rents.length) {
    throw new Error('term not found');
  }

  const tenant = dbTenant.toObject();
  const landlord = tenant.realmId;
  landlord.name =
    (landlord.isCompany
      ? landlord.companyInfo?.name
      : landlord.contacts?.[0]?.name) || '';
  landlord.hasCompanyInfo = !!landlord.companyInfo;
  landlord.hasBankInfo = !!landlord.bankInfo;
  landlord.hasAddress = !!landlord.addresses?.length;
  landlord.hasContact = !!landlord.contacts?.length;

  delete tenant.realmId;

  tenant.contract = {
    name: tenant.contract,
    lease: tenant.leaseId,
    beginDate: tenant.beginDate,
    endDate: tenant.endDate,
    properties: tenant.properties.reduce((acc, { propertyId }) => {
      acc.push(propertyId);
      return acc;
    }, [])
  };

  delete tenant.leaseId;

  tenant.rents = tenant.rents.filter(
    (rent) => rent.term === Number(params.term)
  );

  // data that will be injected in the email content files (ejs files)
  return {
    landlord,
    tenant,
    period: params.term,
    today: moment().format('DD/MM/YYYY')
  };
}
