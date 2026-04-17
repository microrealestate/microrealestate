import { Collections } from '@microrealestate/common';

export async function get(recordId, params = {}) {
  const organizationId = params.organizationId;
  if (!organizationId) {
    throw new Error('organization id missing');
  }

  const landlord = await Collections.Realm.findOne({
    _id: organizationId
  }).lean();

  if (!landlord) {
    throw new Error('organization not found');
  }

  return {
    landlord,
    ...params
  };
}
