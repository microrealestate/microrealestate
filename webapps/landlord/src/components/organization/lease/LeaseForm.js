import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextAreaField } from '@microrealestate/commonui/components/formfields/TextAreaField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';

const timeRanges = ['days', 'weeks', 'months', 'years'];

function initValues(lease) {
  return {
    name: lease?.name || '',
    description: lease?.description || '',
    numberOfTerms: lease?.numberOfTerms || '',
    timeRange: lease?.timeRange || '',
    active: true,
    autoRenew: lease?.autoRenew ?? false
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
    active: Yup.boolean().required(),
    autoRenew: Yup.boolean()
  });
}

export const validate = (newLease, existingLeases) => {
  return getValidationSchema(newLease, existingLeases).validate(
    initValues(newLease)
  );
};

const LeaseForm = ({ onSubmit }) => {
  const t = useTranslations('common');
  const store = useStore();

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
      {({ values }) => {
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
                <TextAreaField
                  label={t('Description')}
                  name="description"
                  rows={2}
                />
                <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:gap-2">
                  <SelectField
                    label={t('Schedule type')}
                    name="timeRange"
                    values={timeRanges.map((timeRange) => ({
                      id: timeRange,
                      label: t(timeRange),
                      value: timeRange
                    }))}
                    disabled={values.usedByTenants}
                    className="w-full"
                  />

                  <NumberField
                    label={t('Number of periods')}
                    name="numberOfTerms"
                    disabled={values.usedByTenants}
                    className="w-full"
                  />
                </div>

                <SwitchField
                  label={t('Automatic renewal')}
                  name="autoRenew"
                  dataCy="leaseAutoRenew"
                />
              </Section>
              <SubmitButton label={t('Save')} />
            </Form>
          </>
        );
      }}
    </Formik>
  );
};

export default observer(LeaseForm);
