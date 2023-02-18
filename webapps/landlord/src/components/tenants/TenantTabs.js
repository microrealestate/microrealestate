import { Box, Paper, Tab, Tabs } from '@material-ui/core';
import { TabPanel, useTabChangeHelper } from '../Tabs';

import BillingForm from './forms/BillingForm';
import DocumentsForm from './forms/DocumentsForm';
import LeaseContractForm from './forms/LeaseContractForm';
import { observer } from 'mobx-react-lite';
import ReportProblemOutlinedIcon from '@material-ui/icons/ReportProblemOutlined';
import { StoreContext } from '../../store';
import TenantForm from './forms/TenantForm';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

function TenantTabs({ onSubmit /*, setError*/, readOnly }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const { handleTabChange, tabSelectedIndex } = useTabChangeHelper();

  const hasMissingCompulsaryDocuments =
    store.tenant.selected.filesToUpload.some(({ missing }) => missing);

  return (
    <Paper>
      <Tabs
        variant="scrollable"
        value={tabSelectedIndex}
        onChange={handleTabChange}
        aria-label="Tenant tabs"
      >
        <Tab label={t('Tenant')} wrapped />
        <Tab label={t('Lease')} wrapped />
        <Tab label={t('Billing')} wrapped />
        <Tab
          label={
            <Box display="flex" justifyContent="center" alignItems="center">
              {hasMissingCompulsaryDocuments ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  color="warning.main"
                  mr={0.8}
                >
                  <ReportProblemOutlinedIcon fontSize="small" />
                </Box>
              ) : null}
              <Box color="text.primary" fontSize="caption.fontSize">
                {t('Documents')}
              </Box>
            </Box>
          }
        />
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
      <TabPanel value={tabSelectedIndex} index={3}>
        <DocumentsForm onSubmit={onSubmit} readOnly={readOnly} />
      </TabPanel>
    </Paper>
  );
}

export default observer(TenantTabs);
