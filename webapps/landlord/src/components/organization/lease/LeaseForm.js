import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import {
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { useContext, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const timeRanges = ['days', 'weeks', 'months', 'years'];

function initValues(lease) {
  return {
    name: lease?.name || '',
    description: lease?.description || '',
    numberOfTerms: lease?.numberOfTerms || '',
    timeRange: lease?.timeRange || '',
    active: lease?.active || true
  };
}

function getValidationSchema(newLease, existingLeases) {
  return Yup.object().shape({
    name: Yup.string()
      .notOneOf(
        existingLeases
          .filter(({ _id }) => newLease?._id !== _id)
          .map(({ name }) => name)
      )
      .required(),
    description: Yup.string(),
    numberOfTerms: Yup.number().integer().min(1).required(),
    timeRange: Yup.string().required(),
    active: Yup.boolean().required()
  });
}

export const validate = (newLease, existingLeases) => {
  return getValidationSchema(newLease, existingLeases).validate(
    initValues(newLease)
  );
};

const LeaseForm = ({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const validationSchema = useMemo(
    () => getValidationSchema(store.lease.selected, store.lease.items),
    [store.lease.selected, store.lease.items]
  );

  const initialValues = useMemo(() => {
    return initValues(store.lease.selected);
  }, [store.lease.selected]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <>
            {values.usedByTenants && (
              <div className="text-sm text-warning mb-4">
                {t(
                  'This contract is currently used, only some fields can be updated'
                )}
              </div>
            )}
            <Form autoComplete="off">
              <Section
                label={t('Contract information')}
                visible={!store.lease.selected?.stepperMode}
              >
                <TextField label={t('Name')} name="name" />
                <TextField
                  label={t('Description')}
                  name="description"
                  multiline
                  rows={2}
                />
                <div className="sm:flex sm:flex-row sm:gap-2 ">
                  <SelectField
                    label={t('Schedule type')}
                    name="timeRange"
                    values={timeRanges.map((timeRange) => ({
                      id: timeRange,
                      label: t(timeRange),
                      value: timeRange
                    }))}
                    disabled={values.usedByTenants}
                  />
                  <NumberField
                    label={t('Number of terms')}
                    name="numberOfTerms"
                    disabled={values.usedByTenants}
                  />
                </div>
              </Section>
              <SubmitButton
                label={!isSubmitting ? t('Save') : t('Submitting')}
              />
            </Form>
          </>
        );
      }}
    </Formik>
  );
};

export default observer(LeaseForm);
