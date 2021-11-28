import { Paper, Tab, Tabs } from '@material-ui/core';
import { StoreContext, getStoreInstance } from '../../../store';
import { TabPanel, useTabChangeHelper } from '../../../components/Tabs';
import { useCallback, useContext, useState } from 'react';

import BillingForm from '../../../components/organization/BillingForm';
import LandlordForm from '../../../components/organization/LandlordForm';
import Leases from '../../../components/organization/Leases';
import Members from '../../../components/organization/Members';
import Page from '../../../components/Page';
import RequestError from '../../../components/RequestError';
import ThirdPartiesForm from '../../../components/organization/ThirdPartiesForm';
import { isServer } from '../../../utils';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { setOrganizationId } from '../../../utils/fetch';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const hashes = ['landlord', 'billing', 'leases', 'access', 'third-parties'];

const SettingTabs = observer(({ onSubmit, setError }) => {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const { handleTabChange, tabSelectedIndex, tabsReady } =
    useTabChangeHelper(hashes);

  const onSubmitted = ({ isOrgNameChanged, isLocaleChanged }) => {
    if (isOrgNameChanged || isLocaleChanged) {
      moment.locale(store.organization.selected.locale);
      router.push(`/${store.organization.selected.name}/settings`, null, {
        locale: store.organization.selected.locale,
      });
    }
  };

  return (
    tabsReady && (
      <>
        <Tabs
          variant="scrollable"
          value={tabSelectedIndex}
          onChange={handleTabChange}
          aria-label="Setting tabs"
        >
          <Tab label={t('Landlord')} />
          <Tab label={t('Billing')} />
          <Tab label={t('Contracts')} />
          <Tab label={t('Collaborators')} />
          <Tab label={t('Third-parties')} />
        </Tabs>
        <TabPanel value={tabSelectedIndex} index={0}>
          <LandlordForm onSubmit={onSubmit} onSubmitted={onSubmitted} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={1}>
          <BillingForm onSubmit={onSubmit} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={2}>
          <Leases setError={setError} />
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
  const [error, setError] = useState('');

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

      setError('');

      const { status, data: updatedOrganization } =
        await store.organization.update(organization);
      if (status !== 200) {
        switch (status) {
          case 422:
            return setError(t('Some fields are missing'));
          case 403:
            return setError(t('You are not allowed to update the settings'));
          case 409:
            return setError(t('The organization name already exists'));
          default:
            return setError(t('Something went wrong'));
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
    [store.organization, store.user]
  );

  return (
    <Page>
      <RequestError error={error} />
      <Paper>
        <SettingTabs onSubmit={onSubmit} setError={setError} />
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
