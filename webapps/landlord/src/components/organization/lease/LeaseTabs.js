import { Tab, Tabs } from '@material-ui/core';
import { TabPanel, useTabChangeHelper } from '../../Tabs';

import LeaseForm from './LeaseForm';
import TemplateForm from './TemplateForm';
import useTranslation from 'next-translate/useTranslation';

const hashes = ['contract', 'templates'];

export default function LeaseTabs({ onSubmit }) {
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
          aria-label="Lease tabs"
        >
          <Tab
            label={t('Contract information')}
            wrapped
            data-cy="tabContractInfo"
          />
          <Tab
            label={t('Template documents')}
            wrapped
            data-cy="tabContractTemplates"
          />
        </Tabs>
        <TabPanel value={tabSelectedIndex} index={0}>
          <LeaseForm onSubmit={onSubmit} />
        </TabPanel>
        <TabPanel value={tabSelectedIndex} index={1}>
          <TemplateForm onSubmit={onSubmit} />
        </TabPanel>
      </>
    )
  );
}
