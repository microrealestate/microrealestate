import { setOrganizationId } from '../../utils/fetch';

export function updateStoreOrganization(store, updatedOrganization) {
  store.organization.setSelected(updatedOrganization, store.user);
  store.organization.setItems([
    ...store.organization.items.filter(
      ({ _id }) => _id !== updatedOrganization._id
    ),
    updatedOrganization
  ]);
  setOrganizationId(updatedOrganization._id);
}

export function mergeOrganization(organization = {}, orgPart) {
  const gmail = organization.thirdParties?.gmail
    ? {
        ...organization.thirdParties.gmail,
        appPasswordUpdated: false
      }
    : null;
  const smtp = organization.thirdParties?.smtp
    ? {
        ...organization.thirdParties.smtp,
        passwordUpdated: false
      }
    : null;
  const mailgun = organization.thirdParties?.mailgun
    ? {
        ...organization.thirdParties.mailgun,
        apiKeyUpdated: false
      }
    : null;
  const b2 = organization.thirdParties?.b2
    ? {
        ...organization.thirdParties.b2,
        applicationKeyIdUpdated: false,
        applicationKeyUpdated: false
      }
    : null;

  const mergedOrg = {
    ...organization,
    // Do not update keys when the thirdParties is not touched
    thirdParties: {
      gmail,
      smtp,
      mailgun,
      b2
    },
    ...orgPart
  };
  return mergedOrg;
}
