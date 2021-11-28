import * as Yup from 'yup';

import { Form, Formik } from 'formik';
import { FormSection, FormTextField, SubmitButton } from '../Form';
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
            <FormSection
              label={t('Internal note')}
              defaultExpanded={!!initialValues.description}
            >
              <FormTextField
                label={t('Note')}
                name="description"
                value={description}
                multiline
                rows={3}
              />
            </FormSection>
            <SubmitButton label={!isSubmitting ? t('Save') : t('Saving')} />
          </Form>
        );
      }}
    </Formik>
  );
};

export default InternalNoteForm;
