import { useCallback, useContext } from 'react';
import { Button } from '../../ui/button';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import TemplateList from './TemplateList';
import useTranslation from 'next-translate/useTranslation';

export default function TemplateForm({ onSubmit }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');

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
