import * as Yup from 'yup';

import { Form, Formik } from 'formik';
import {
  Section,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { useCallback, useContext, useMemo } from 'react';

import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  description: Yup.string(),
});

const InternalNoteForm = ({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      description: store.rent.selected.description || '',
    }),
    [store.rent.selected]
  );

  const _onSubmit = useCallback(
    async (values) => {
      const paymentPart = {
        ...values,
      };
      await onSubmit(paymentPart);
    },
    [onSubmit]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={_onSubmit}
    >
      {({ isSubmitting, values: { description } }) => {
        return (
          <Form autoComplete="off">
            <Section
              label={t('Internal note')}
              defaultExpanded={!!initialValues.description}
            >
              <TextField
                label={t('Note')}
                name="description"
                value={description}
                multiline
                rows={3}
              />
            </Section>
            <SubmitButton label={!isSubmitting ? t('Save') : t('Saving')} />
          </Form>
        );
      }}
    </Formik>
  );
};

export default InternalNoteForm;
