import * as Yup from 'yup';
import {
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  description: Yup.string(),
  warrantyPeriod: Yup.number().min(0).required(),
  contact: Yup.string().required(),
  phone: Yup.string(),
  email: Yup.string().email()
});

const WarrantyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      type: store.warranty.selected?.type || '',
      name: store.warranty.selected?.name || '',
      description: store.warranty.selected?.description || '',
      warrantyPeriod: store.warranty.selected?.warrantyPeriod || '',
      contact: store.warranty.selected?.contact || '',
      phone: store.warranty.selected?.phone || '',
      email: store.warranty.selected?.email || ''
    }),
    [store.warranty.selected]
  );

  const warrantyTypes = useMemo(
    () =>
      [
        { id: 'electrical', labelId: 'Electrical' },
        { id: 'plumbing', labelId: 'Plumbing' },
        { id: 'structural', labelId: 'Structural' }
      ].map((type) => ({
        id: type.id,
        value: type.id,
        label: t(type.labelId)
      })),
    [t]
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
              <div className="sm:flex sm:gap-2">
                <SelectField
                  label={t('Warranty Type')}
                  name="type"
                  values={warrantyTypes}
                />
                <TextField label={t('Name')} name="name" />
              </div>
              <TextField label={t('Description')} name="description" />
              <NumberField label={t('Warranty Period (months)')} name="warrantyPeriod" />
              <TextField label={t('Contact')} name="contact" />
              <TextField label={t('Phone')} name="phone" />
              <TextField label={t('Email')} name="email" />
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
