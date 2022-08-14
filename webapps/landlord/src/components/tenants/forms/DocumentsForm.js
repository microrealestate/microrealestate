import { Button } from '@material-ui/core';
import { Section } from '@microrealestate/commonui/components';
import TenantDocumentList from '../TenantDocumentList';
import { useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function DocumentsForm({ onSubmit, readOnly }) {
  const { t } = useTranslation('common');

  const handleNext = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      <Section label={t('Documents')}>
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
