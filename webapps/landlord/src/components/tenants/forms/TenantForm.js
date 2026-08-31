import { AddressField } from '@microrealestate/commonui/components/formfields/AddressField';
import { ArrayField } from '@microrealestate/commonui/components/formfields/ArrayField';
import { ContactField } from '@microrealestate/commonui/components/formfields/ContactField';
import {
  RadioGroupField,
  RadioItem
} from '@microrealestate/commonui/components/formfields/RadioGroupField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCompany: Yup.string().required(),
  legalRepresentative: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  legalStructure: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  ein: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  dos: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string()
  }),
  contacts: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      phone1: Yup.string().required(),
      phone2: Yup.string()
    })
  ),
  address: Yup.object().shape({
    street1: Yup.string().required(),
    street2: Yup.string(),
    city: Yup.string().required(),
    zipCode: Yup.string().required(),
    state: Yup.string(),
    country: Yup.string().required()
  })
});

const emptyContact = {
  key: nanoid(),
  name: '',
  email: '',
  phone1: '',
  phone2: ''
};

const initValues = (tenant) => {
  return {
    name: tenant?.name || '',
    isCompany: tenant?.isCompany ? 'true' : 'false',
    legalRepresentative: tenant?.manager || '',
    legalStructure: tenant?.legalForm || '',
    ein: tenant?.siret || '',
    dos: tenant?.rcs || '',
    capital: tenant?.capital || '',
    contacts: tenant?.contacts?.length
      ? tenant.contacts.map(({ _id, name, email, phone1, phone2 }) => ({
          key: nanoid(),
          name: name || '',
          email,
          phone1: phone1 || '',
          phone2: phone2 || ''
        }))
      : [{ ...emptyContact, key: nanoid() }],
    address: {
      street1: tenant?.street1 || '',
      street2: tenant?.street2 || '',
      city: tenant?.city || '',
      zipCode: tenant?.zipCode || '',
      state: tenant?.state || '',
      country: tenant?.country || ''
    }
  };
};

export const validate = (tenant) => {
  return validationSchema.validate(initValues(tenant));
};

const TenantForm = observer(({ readOnly, onSubmit }) => {
  const t = useTranslations('common');
  const store = useStore();

  const initialValues = useMemo(
    () => initValues(store.tenant?.selected),
    [store.tenant?.selected]
  );

  const _onSubmit = async (tenant) => {
    await onSubmit({
      name: tenant.name,
      isCompany: tenant.isCompany === 'true',
      company: tenant.isCompany === 'true' ? tenant.name : '',
      manager:
        tenant.isCompany === 'true' ? tenant.legalRepresentative : tenant.name,
      legalForm: tenant.isCompany === 'true' ? tenant.legalStructure : '',
      siret: tenant.isCompany === 'true' ? tenant.ein : '',
      rcs: tenant.isCompany === 'true' ? tenant.dos : '',
      capital: tenant.isCompany === 'true' ? tenant.capital : '',
      street1: tenant.address.street1,
      street2: tenant.address.street2 || '',
      zipCode: tenant.address.zipCode,
      city: tenant.address.city,
      state: tenant.address.state,
      country: tenant.address.country,
      contacts: tenant.contacts
        .filter(({ name }) => !!name)
        .map(({ name, email, phone1, phone2 }) => {
          return {
            name,
            email,
            phone1,
            phone2
          };
        })
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={_onSubmit}
    >
      {({ values }) => {
        return (
          <Form autoComplete="off">
            <Section
              label={t('Tenant information')}
              visible={!store.tenant.selected.stepperMode}
            >
              <TextField label={t('Name')} name="name" readOnly={readOnly} />
              <RadioGroupField
                name="isCompany"
                label={t('The tenant belongs to')}
                readOnly={readOnly}
              >
                <RadioItem
                  name="isCompany-false"
                  value="false"
                  label={t('A personal account')}
                  data-cy="tenantIsPersonalAccount"
                />
                <RadioItem
                  name="isCompany-true"
                  value="true"
                  label={t('A business or an institution')}
                  data-cy="tenantIsBusinessAccount"
                />
              </RadioGroupField>
              {values.isCompany === 'true' && (
                <>
                  <TextField
                    label={t('Legal representative')}
                    name="legalRepresentative"
                    readOnly={readOnly}
                  />
                  <TextField
                    label={t('Legal structure')}
                    name="legalStructure"
                    readOnly={readOnly}
                  />
                  <TextField
                    label={t('Business registration number')}
                    name="ein"
                    readOnly={readOnly}
                  />
                  <TextField
                    label={t('Commercial register')}
                    name="dos"
                    readOnly={readOnly}
                  />
                  <TextField
                    label={t('Capital')}
                    name="capital"
                    readOnly={readOnly}
                  />
                </>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField readOnly={readOnly} />
            </Section>
            <Section
              label={t('Contacts')}
              description={t(
                "The contacts will receive the receipts and will be able to access the tenant's portal"
              )}
            >
              <ArrayField
                name="contacts"
                addLabel={t('Add a contact')}
                emptyItem={emptyContact}
                items={values.contacts}
                readOnly={readOnly}
                renderTitle={(_, index) =>
                  t('Contact {count}', { count: index + 1 })
                }
                renderContent={(_, index) => (
                  <ContactField
                    contactName={`contacts[${index}].name`}
                    emailName={`contacts[${index}].email`}
                    phone1Name={`contacts[${index}].phone1`}
                    phone2Name={`contacts[${index}].phone2`}
                    readOnly={readOnly}
                  />
                )}
              />
            </Section>
            {!readOnly && <SubmitButton label={t('Save')} />}
          </Form>
        );
      }}
    </Formik>
  );
});

export default TenantForm;
