import { useCallback, useContext } from 'react';

import { Button } from '@material-ui/core';
import CompulsoryDocumentStatus from '../CompulsaryDocumentStatus';
import { observer } from 'mobx-react-lite';
import { Section } from '@microrealestate/commonui/components';
import { StoreContext } from '../../../store';
import TenantDocumentList from '../TenantDocumentList';
import useTranslation from 'next-translate/useTranslation';

function DocumentsForm({ onSubmit, readOnly }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const handleNext = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      <Section label={t('Documents')}>
        <CompulsoryDocumentStatus tenant={store.tenant.selected} mb={2} />
        <TenantDocumentList disabled={readOnly} />
      </Section>
      <Button
        variant="contained"
        color="primary"
        onClick={handleNext}
        data-cy="submit"
      >
        {t('Save')}
      </Button>
    </>
  );
}

export default observer(DocumentsForm);
