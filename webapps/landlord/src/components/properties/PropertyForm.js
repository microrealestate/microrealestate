/* eslint-disable sort-imports */
import * as Yup from 'yup';
import {
  AddressField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import { sqftToSqm, sqmToSqft } from '../../utils/surfaceConversion';
import PropertyIcon from './PropertyIcon';
import types from './types';
import useTranslation from 'next-translate/useTranslation';
/* eslint-enable sort-imports */

const PROPERTY_TYPE_STORAGE_KEY_PREFIX = 'property-type-settings:';

function normalizeType(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function toTypeLabel(typeId, t) {
  const defaultType = types.find((type) => type.id === typeId);
  if (defaultType) {
    return t(defaultType.labelId);
  }

  return String(typeId)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

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
  const [customPropertyTypes, setCustomPropertyTypes] = useState([]);
  const [hiddenPropertyTypes, setHiddenPropertyTypes] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const organizationSlug = String(
      store.organization.selected?.name || 'default'
    );
    const storageKey = `${PROPERTY_TYPE_STORAGE_KEY_PREFIX}${organizationSlug}`;

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (!storedValue) {
        setCustomPropertyTypes([]);
        setHiddenPropertyTypes([]);
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      setCustomPropertyTypes(
        Array.isArray(parsedValue?.custom)
          ? parsedValue.custom
              .map((type) => normalizeType(type))
              .filter(Boolean)
          : []
      );
      setHiddenPropertyTypes(
        Array.isArray(parsedValue?.hidden)
          ? parsedValue.hidden
              .map((type) => normalizeType(type))
              .filter(Boolean)
          : []
      );
    } catch (error) {
      setCustomPropertyTypes([]);
      setHiddenPropertyTypes([]);
    }
  }, [store.organization.selected?.name]);

  /*
    INITIAL VALUES

    ORIGINAL FIELDS:
    - type, name, description, surface, phone, digicode, address, rent

    NEW FIELDS:
    - parentPropertyId
    - rentLowSqftYear, rentMedianSqftYear, rentHighSqftYear
  */
  const initialValues = useMemo(() => {
    // DATABASE STORES IN SQ M, CONVERT TO SQ FT FOR DISPLAY/EDITING
    const surfaceSqm = store.property.selected?.surface || 0;
    const surfaceSqft = surfaceSqm > 0 ? sqmToSqft(surfaceSqm) : '';

    return {
      type: store.property.selected?.type || '',
      name: store.property.selected?.name || '',
      description: store.property.selected?.description || '',
      surface: surfaceSqft,
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
    };
  }, [store.property.selected]);

  /*
    PROPERTY TYPES DROPDOWN — ORIGINAL LOGIC
  */
  const propertyTypes = useMemo(() => {
    const typeSet = new Set(types.map((type) => normalizeType(type.id)));

    customPropertyTypes.forEach((type) => {
      const normalizedType = normalizeType(type);
      if (normalizedType) {
        typeSet.add(normalizedType);
      }
    });

    hiddenPropertyTypes.forEach((type) => {
      typeSet.delete(normalizeType(type));
    });

    const selectedType = normalizeType(store.property.selected?.type);
    if (selectedType) {
      typeSet.add(selectedType);
    }

    return Array.from(typeSet)
      .sort((a, b) => a.localeCompare(b))
      .map((typeId) => ({
        id: typeId,
        value: typeId,
        label: toTypeLabel(typeId, t),
        renderIcon: () => <PropertyIcon type={typeId} />
      }));
  }, [
    customPropertyTypes,
    hiddenPropertyTypes,
    store.property.selected?.type,
    t
  ]);

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
  const unitTypes = useMemo(
    () =>
      propertyTypes
        .map((type) => type.value)
        .filter((type) => type !== 'building'),
    [propertyTypes]
  );

  const handleSubmit = (formValues) => {
    // CONVERT SURFACE FROM SQ FT (FORM INPUT) TO SQ M (DATABASE)
    const propertyData = {
      ...formValues,
      surface: formValues.surface ? sqftToSqm(formValues.surface) : 0
    };
    return onSubmit(propertyData);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, isSubmitting }) => {
        const isUnit = unitTypes.includes(values.type);
        const surfaceSqm = values.surface ? sqftToSqm(values.surface) : 0;

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
              {values.surface && (
                <div className="text-sm text-muted-foreground mt-1">
                  ≈ {surfaceSqm.toFixed(2)} sq m
                </div>
              )}
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
