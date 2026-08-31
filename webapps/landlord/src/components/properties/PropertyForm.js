import { AddressField } from '@microrealestate/commonui/components/formfields/AddressField';
import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
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
  const t = useTranslations('common');
  const store = useStore();

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
                <div className="sm:flex sm:gap-2">
                  <NumberField
                    label={t('Surface')}
                    name="surface"
                    className="w-full"
                  />
                  <TextField
                    label={t('Phone')}
                    name="phone"
                    className="w-full"
                  />
                  <TextField
                    label={t('Door code')}
                    name="digicode"
                    className="w-full"
                  />
                </div>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField />
            </Section>
            <Section label={t('Rent')}>
              <NumberField
                label={t('Rent excluding tax and charges')}
                name="rent"
              />
            </Section>
            <SubmitButton label={t('Save')} />
          </Form>
        );
      }}
    </Formik>
  );
});

export default PropertyForm;
