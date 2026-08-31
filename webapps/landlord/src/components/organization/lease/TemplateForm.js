import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useStore } from '@/providers/StoreProvider';
import TemplateList from './TemplateList';

export default function TemplateForm({ onSubmit }) {
  const store = useStore();
  const t = useTranslations('common');

  const handleNext = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      <Section
        label={t('Template documents')}
        visible={!store.lease.selected.stepperMode}
      >
        <TemplateList />
      </Section>
      {store.lease?.selected.stepperMode ? (
        <Button onClick={handleNext} data-cy="submit">
          {t('Save')}
        </Button>
      ) : null}
    </>
  );
}
