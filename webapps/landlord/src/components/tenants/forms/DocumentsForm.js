import { useCallback, useContext } from 'react';

import { Button } from '@material-ui/core';
import { FormSection } from '../../Form';
import { StoreContext } from '../../../store';
import TenantDocumentList from '../TenantDocumentList';
import useTranslation from 'next-translate/useTranslation';

export default function DocumentsForm({ onSubmit, readOnly }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');

  const handleNext = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      <FormSection label={t('Documents')}>
        <TenantDocumentList disabled={readOnly} />
      </FormSection>
      {store.tenant?.selected.stepperMode ? (
        <Button variant="contained" color="primary" onClick={handleNext}>
          {t('Finish')}
        </Button>
      ) : null}
    </>
  );
}
