import * as Yup from 'yup';
import {
  AddressField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import PropertyIcon from './PropertyIcon';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import types from './types';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  description: Yup.string(),
  phone: Yup.string(),
  digicode: Yup.string(),
  address: Yup.object().shape({
    street1: Yup.string(),
    street2: Yup.string(),
    city: Yup.string(),
    zipCode: Yup.string(),
    state: Yup.string(),
    country: Yup.string()
  }),
  rent: Yup.number().min(0).required()
});

const PropertyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      type: store.property.selected?.type || '',
      name: store.property.selected?.name || '',
      description: store.property.selected?.description || '',
      surface: store.property.selected?.surface || '',
      phone: store.property.selected?.phone || '',
      digicode: store.property.selected?.digicode || '',
      address: store.property.selected?.address || {
        street1: '',
        street2: '',
        city: '',
        zipCode: '',
        state: '',
        country: ''
      },
      rent: store.property.selected?.price || ''
    }),
    [store.property.selected]
  );

  const propertyTypes = useMemo(
    () =>
      types.map((type) => ({
        id: type.id,
        value: type.id,
        label: t(type.labelId),
        renderIcon: () => <PropertyIcon type={type.id} />
      })),
    [t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section label={t('Property information')}>
              <div className="sm:flex sm:gap-2">
                <SelectField
                  label={t('Property Type')}
                  name="type"
                  values={propertyTypes}
                />
                <TextField label={t('Name')} name="name" />
              </div>
              <TextField label={t('Description')} name="description" />

              {[
                'store',
                'building',
                'apartment',
                'room',
                'office',
                'garage'
              ].includes(values.type) && (
                <div className="sm:flex sm:gap-2">
                  <NumberField label={t('Surface')} name="surface" />
                  <TextField label={t('Phone')} name="phone" />
                  <TextField label={t('Digicode')} name="digicode" />
                </div>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField />
            </Section>
            <Section label={t('Rent')}>
              <NumberField
                label={t('Rent excluding tax and expenses')}
                name="rent"
              />
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

export default PropertyForm;
