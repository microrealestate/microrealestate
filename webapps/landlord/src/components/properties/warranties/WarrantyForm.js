import * as Yup from 'yup';
import {
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
  DateField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  provider: Yup.string().required(),
  coverageScope: Yup.object().shape({
    coveredItems: Yup.string().required(),
    typesOfDefects: Yup.string().required()
  }),
  warrantyDuration: Yup.object().shape({
    startDate: Yup.date().required(),
    expirationDate: Yup.date().required()
  })
});

const WarrantyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      name: store.warranty.selected?.name || '',
      provider: store.warranty.selected?.provider || '',
      coverageScope: {
        coveredItems: store.warranty.selected?.coverageScope?.coveredItems || '',
        typesOfDefects: store.warranty.selected?.coverageScope?.typesOfDefects || ''
      },
      warrantyDuration: {
        startDate: store.warranty.selected?.warrantyDuration?.startDate || '',
        expirationDate: store.warranty.selected?.warrantyDuration?.expirationDate || ''
      }
    }),
    [store.warranty.selected]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section label={t('Warranty information')}>
              <TextField label={t('Name')} name="name" />
              <TextField label={t('Provider')} name="provider" />
              <TextField label={t('Covered Items')} name="coverageScope.coveredItems" />
              <TextField label={t('Types of Defects')} name="coverageScope.typesOfDefects" />
              <DateField label={t('Start Date')} name="warrantyDuration.startDate" />
              <DateField label={t('Expiration Date')} name="warrantyDuration.expirationDate" />
            </Section>
            <SubmitButton
              size="large"
              label={!isSubmitting ? t('Save') : t('Saving')}
            />
          </Form>
        );
      }}
    </Formik>
  );
});

export default WarrantyForm;
