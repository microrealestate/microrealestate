import { Tab, Tabs } from '@material-ui/core';
import { TabPanel, useTabChangeHelper } from '../Tabs';

import BillingForm from './forms/BillingForm';
import LeaseContractForm from './forms/LeaseContractForm';
import TenantForm from './forms/TenantForm';
import useTranslation from 'next-translate/useTranslation';

const hashes = ['tenant', 'contract', 'billing'];

export default function TenantTabs({ onSubmit /*, setError*/, readOnly }) {
  const { t } = useTranslation('common');
  const { handleTabChange, tabSelectedIndex, tabsReady } =
    useTabChangeHelper(hashes);

  return (
    tabsReady && (
      <>
        <Tabs
          variant="scrollable"
          value={tabSelectedIndex}
          onChange={handleTabChange}
          aria-label="Tenant tabs"
        >
          <Tab label={t('Tenant')} wrapped />
          <Tab label={t('Contract')} wrapped />
          <Tab label={t('Billing')} wrapped />
        </Tabs>
        <TabPanel value={tabSelectedIndex} index={0}>
          <TenantForm onSubmit={onSubmit} readOnly={readOnly} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={1}>
          <LeaseContractForm onSubmit={onSubmit} readOnly={readOnly} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={2}>
          <BillingForm onSubmit={onSubmit} readOnly={readOnly} />
        </TabPanel>
      </>
    )
  );
}
