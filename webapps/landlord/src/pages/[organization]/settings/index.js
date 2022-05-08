import { getStoreInstance, StoreContext } from '../../../store';
import { Paper, Tab, Tabs } from '@material-ui/core';
import { TabPanel, useTabChangeHelper } from '../../../components/Tabs';
import { useCallback, useContext } from 'react';

import BillingForm from '../../../components/organization/BillingForm';
import getConfig from 'next/config';
import { isServer } from '../../../utils';
import LandlordForm from '../../../components/organization/LandlordForm';
import Leases from '../../../components/organization/Leases';
import Members from '../../../components/organization/Members';
import { observer } from 'mobx-react-lite';
import Page from '../../../components/Page';
import { setOrganizationId } from '../../../utils/fetch';
import ThirdPartiesForm from '../../../components/organization/ThirdPartiesForm';
import { toJS } from 'mobx';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const {
  publicRuntimeConfig: { BASE_PATH },
} = getConfig();

const hashes = ['landlord', 'billing', 'leases', 'access', 'third-parties'];

const SettingTabs = observer(({ onSubmit }) => {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const { handleTabChange, tabSelectedIndex, tabsReady } =
    useTabChangeHelper(hashes);

  const onSubmitted = useCallback(
    ({ isOrgNameChanged, isLocaleChanged }) => {
      if (isOrgNameChanged || isLocaleChanged) {
        window.location.assign(
          `${BASE_PATH}/${store.organization.selected.locale}/${store.organization.selected.name}/settings`
        );
      }
    },
    [store.organization.selected]
  );

  return (
    tabsReady && (
      <>
        <Tabs
          variant="scrollable"
          value={tabSelectedIndex}
          onChange={handleTabChange}
          aria-label="Setting tabs"
        >
          <Tab label={t('Landlord')} wrapped />
          <Tab label={t('Billing')} wrapped />
          <Tab label={t('Contracts')} wrapped />
          <Tab label={t('Collaborators')} wrapped />
          <Tab label={t('Third-parties')} wrapped />
        </Tabs>
        <TabPanel value={tabSelectedIndex} index={0}>
          <LandlordForm onSubmit={onSubmit} onSubmitted={onSubmitted} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={1}>
          <BillingForm onSubmit={onSubmit} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={2}>
          <Leases />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={3}>
          <Members onSubmit={onSubmit} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={4}>
          <ThirdPartiesForm onSubmit={onSubmit} />
        </TabPanel>
      </>
    )
  );
});

const Settings = observer(() => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const onSubmit = useCallback(
    async (orgPart) => {
      if (!store.user.isAdministrator) {
        return;
      }

      const organization = {
        // Do not update keys when the thirdParties is not touched
        thirdParties: {
          mailgun: { apiKeyUpdated: false },
          b2: { applicationKeyIdUpdated: false, applicationKeyUpdated: false },
        },
        ...store.organization.selected,
        ...orgPart,
      };

      const { status, data: updatedOrganization } =
        await store.organization.update(organization);
      if (status !== 200) {
        switch (status) {
          case 422:
            return store.pushToastMessage({
              message: t('Some fields are missing'),
              severity: 'error',
            });
          case 403:
            return store.pushToastMessage({
              message: t('You are not allowed to update the settings'),
              severity: 'error',
            });
          case 409:
            return store.pushToastMessage({
              message: t('The organization name already exists'),
              severity: 'error',
            });
          default:
            return store.pushToastMessage({
              message: t('Something went wrong'),
              severity: 'error',
            });
        }
      }

      store.organization.setSelected(updatedOrganization, store.user);
      store.organization.setItems([
        ...store.organization.items.filter(
          ({ _id }) => _id !== updatedOrganization._id
        ),
        updatedOrganization,
      ]);
      setOrganizationId(updatedOrganization._id);
    },
    [store, t]
  );

  return (
    <Page>
      <Paper>
        <SettingTabs onSubmit={onSubmit} />
      </Paper>
    </Page>
  );
});

Settings.getInitialProps = async (context) => {
  console.log('Settings.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();

  const { status } = await store.lease.fetch();
  if (status !== 200) {
    return { error: { statusCode: status } };
  }

  return {
    initialState: {
      store: toJS(store),
    },
  };
};

export default withAuthentication(Settings);
