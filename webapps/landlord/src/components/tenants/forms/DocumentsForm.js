import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useStore } from '@/providers/StoreProvider';
import TenantDocumentList from '../TenantDocumentList';
import UploadFileList from '../UploadFileList';

export default function DocumentsForm({ onSubmit, readOnly }) {
  const t = useTranslations('common');
  const store = useStore();

  const handleNext = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      <Section label={t('Uploaded documents')}>
        <UploadFileList disabled={readOnly} />
      </Section>

      <Section label={t('Text documents')}>
        <TenantDocumentList disabled={readOnly} />
      </Section>

      {store.tenant.selected.stepperMode && (
        <Button onClick={handleNext} data-cy="submit">
          {t('Save')}
        </Button>
      )}
    </>
  );
}
