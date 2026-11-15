import { AddressField } from '@microrealestate/commonui/components/formfields/AddressField';
import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { PROPERTY_KINDS } from '@microrealestate/shared';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import PropertyIcon from './PropertyIcon';
import types from './types';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  description: Yup.string(),
  address: Yup.object().shape({
    street1: Yup.string(),
    street2: Yup.string(),
    city: Yup.string(),
    zipCode: Yup.string(),
    state: Yup.string(),
    country: Yup.string()
  }),
  rent: Yup.number()
    .transform((value, original) => (original === '' ? undefined : value))
    .min(0)
    .when('availableForRent', {
      is: true,
      then: (schema) => schema.required()
    }),
  availableForRent: Yup.boolean()
});

/** @type {import('react').FC<{ onSubmit: (propertyPart: Record<string, unknown>) => Promise<unknown> }>} */
const PropertyForm = observer(({ onSubmit }) => {
  const t = useTranslations('common');
  const store = useStore();

  const initialValues = useMemo(
    () => ({
      type: store.property.selected?.type || '',
      name: store.property.selected?.name || '',
      description: store.property.selected?.description || '',
      surface: store.property.selected?.surface || '',
      address: store.property.selected?.address || {
        street1: '',
        street2: '',
        city: '',
        zipCode: '',
        state: '',
        country: ''
      },
      rent: store.property.selected?.price || '',
      availableForRent: store.property.selected?.availableForRent === true
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
      enableReinitialize={false}
      onSubmit={onSubmit}
    >
      {({ values }) => {
        return (
          <Form autoComplete="off">
            <Section label={t('Property information')}>
              <div className="sm:flex sm:gap-2">
                <SelectField
                  label={t('Property Type')}
                  name="type"
                  values={propertyTypes}
                  className="w-full"
                />
                <TextField label={t('Name')} name="name" className="w-full" />
              </div>
              <TextField label={t('Description')} name="description" />
              {PROPERTY_KINDS.filter(
                (t) => t !== 'parking' && t !== 'letterbox'
              ).includes(values.type) && (
                <NumberField label={t('Surface')} name="surface" />
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField />
            </Section>
            <Section label={t('Rent')} visible={values.availableForRent}>
              <SwitchField
                name="availableForRent"
                label={t('Offered for rent')}
                dataCy="availableForRent"
              />
              {values.availableForRent ? (
                <NumberField
                  label={t('Base rent, excluding charges and VAT')}
                  name="rent"
                />
              ) : null}
            </Section>
            <SubmitButton label={t('Save')} />
          </Form>
        );
      }}
    </Formik>
  );
});

export default PropertyForm;
