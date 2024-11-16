import { Button } from '../../ui/button';
import { Section } from '../../formfields/Section';
import TenantDocumentList from '../TenantDocumentList';
import UploadFileList from '../UploadFileList';
import { useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function DocumentsForm({ onSubmit, readOnly }) {
  const { t } = useTranslation('common');

  const handleNext = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      <Section label={t('Uploaded documents')}>
        <UploadFileList disabled={readOnly} mb={4} />
      </Section>

      <Section label={t('Text documents')}>
        <TenantDocumentList disabled={readOnly} />
      </Section>

      {!readOnly && (
        <Button onClick={handleNext} data-cy="submit">
          {t('Save')}
        </Button>
      )}
    </>
  );
}
