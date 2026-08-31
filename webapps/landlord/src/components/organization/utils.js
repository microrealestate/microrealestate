export function updateStoreOrganization(store, updatedOrganization) {
  store.organization.setSelected(updatedOrganization);
}

export function mergeOrganization(organization = {}, orgPart) {
  const smtp = organization.thirdParties?.smtp
    ? {
        ...organization.thirdParties.smtp,
        passwordUpdated: false
      }
    : null;
  const mergedOrg = {
    ...organization,
    // Do not update keys when the thirdParties is not touched
    thirdParties: {
      smtp
    },
    ...orgPart
  };
  return mergedOrg;
}
