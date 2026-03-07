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

/*
  VALIDATION SCHEMA

  ORIGINAL FIELDS:
  - type, name, description, phone, digicode, address, rent

  NEW FIELDS (OPTIONAL NUMBERS):
  - rentLowSqftYear, rentMedianSqftYear, rentHighSqftYear
  - parentPropertyId (STRING / ID, OPTIONAL)
*/
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
  rent: Yup.number().min(0),

  // NEW OPTIONAL FIELDS FOR MARKET RENT RANGE
  rentLowSqftYear: Yup.number().min(0).nullable(),
  rentMedianSqftYear: Yup.number().min(0).nullable(),
  rentHighSqftYear: Yup.number().min(0).nullable(),

  // NEW OPTIONAL FIELD FOR BUILDING RELATIONSHIP
  parentPropertyId: Yup.string().nullable()
});

const PropertyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  /*
    INITIAL VALUES

    ORIGINAL FIELDS:
    - type, name, description, surface, phone, digicode, address, rent

    NEW FIELDS:
    - parentPropertyId
    - rentLowSqftYear, rentMedianSqftYear, rentHighSqftYear
  */
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
      // ORIGINAL RENT FIELD (BACKED BY price ON THE BACKEND)
      rent: store.property.selected?.price || '',

      // NEW FIELD — BUILDING / UNIT RELATIONSHIP
      parentPropertyId: store.property.selected?.parentPropertyId || '',

      // NEW FIELDS — RENT RANGE IN $ / SQ FT / YEAR
      rentLowSqftYear: store.property.selected?.rentLowSqftYear ?? '',
      rentMedianSqftYear: store.property.selected?.rentMedianSqftYear ?? '',
      rentHighSqftYear: store.property.selected?.rentHighSqftYear ?? ''
    }),
    [store.property.selected]
  );

  /*
    PROPERTY TYPES DROPDOWN — ORIGINAL LOGIC
  */
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

  /*
    NEW — BUILDING OPTIONS

    - FILTER ALL PROPERTIES TO ONLY KEEP type === 'building'
    - USED FOR parentPropertyId WHEN CREATING / EDITING UNITS
  */
  const buildingOptions = useMemo(
    () =>
      store.property.items
        .filter((p) => p.type === 'building')
        .map((b) => ({
          id: b._id,
          value: b._id,
          label: b.name
        })),
    [store.property.items]
  );

  // WHICH TYPES SHOULD HAVE A "BUILDING" DROPDOWN?
  const unitTypes = [
    'apartment',
    'room',
    'office',
    'store',
    'garage',
    'parking',
    'letterbox'
  ];

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      // ORIGINAL BEHAVIOR: onSubmit IS PASSED DOWN FROM PARENT
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting }) => {
        const isUnit = unitTypes.includes(values.type);

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

              {/*
                NEW SECTION — BUILDING RELATIONSHIP

                - ONLY SHOWN WHEN type IS ONE OF THE UNIT TYPES
                - LETS YOU ASSOCIATE THIS PROPERTY WITH A PARENT BUILDING
              */}
              {isUnit && (
                <div className="sm:flex sm:gap-2 mt-2">
                  <SelectField
                    label={t('Building')}
                    name="parentPropertyId"
                    values={[
                      { id: '', value: '', label: t('No building') },
                      ...buildingOptions
                    ]}
                  />
                </div>
              )}
            </Section>

            <Section label={t('Details')}>
              <div className="sm:flex sm:gap-2">
                <NumberField
                  label={t('Surface')}
                  name="surface"
                  endAdornment="sq ft"
                />
                <TextField label={t('Phone')} name="phone" />
                <TextField label={t('Digicode')} name="digicode" />
              </div>
            </Section>

            <Section label={t('Address')}>
              <AddressField />
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
