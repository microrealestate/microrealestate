import * as Yup from 'yup';

import {
  AddressField,
  ContactForm,
  FormSection,
  FormTextField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
} from '../Form';
import { Box, Button } from '@material-ui/core';
import { FieldArray, Form, Formik } from 'formik';

import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCompany: Yup.string().required(),
  legalRepresentative: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required(),
  }),
  legalStructure: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required(),
  }),
  ein: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required(),
  }),
  dos: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string(),
  }),
  contacts: Yup.array().of(
    Yup.object().shape({
      contact: Yup.string().required(),
      email: Yup.string().email().required(),
      phone1: Yup.string(),
      phone2: Yup.string(),
    })
  ),
  address: Yup.object().shape({
    street1: Yup.string().required(),
    street2: Yup.string(),
    city: Yup.string().required(),
    zipCode: Yup.string().required(),
    state: Yup.string(),
    country: Yup.string().required(),
  }),
});

const emptyContact = { contact: '', email: '', phone1: '', phone2: '' };

const TenantForm = observer(({ readOnly, onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = {
    name: store.tenant.selected?.name || '',
    isCompany: store.tenant.selected?.isCompany ? 'true' : 'false',
    legalRepresentative: store.tenant.selected?.manager || '',
    legalStructure: store.tenant.selected?.legalForm || '',
    ein: store.tenant.selected?.siret || '',
    dos: store.tenant.selected?.rcs || '',
    capital: store.tenant.selected?.capital || '',
    contacts: store.tenant.selected?.contacts?.length
      ? store.tenant.selected.contacts.map(
          ({ contact, email, phone, phone1, phone2 }) => ({
            contact,
            email,
            phone1: phone1 || phone,
            phone2: phone2 || '',
          })
        )
      : [emptyContact],
    address: {
      street1: store.tenant.selected?.street1 || '',
      street2: store.tenant.selected?.street2 || '',
      city: store.tenant.selected?.city || '',
      zipCode: store.tenant.selected?.zipCode || '',
      state: store.tenant.selected?.state || '',
      country: store.tenant.selected?.country || '',
    },
  };

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
        .filter(({ contact }) => !!contact)
        .map(({ contact, email, phone1, phone2 }) => {
          return {
            contact,
            email,
            phone1,
            phone2,
          };
        }),
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={_onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <FormSection label={t('Tenant information')}>
              <FormTextField
                label={t('Name')}
                name="name"
                disabled={readOnly}
              />
              <RadioFieldGroup
                aria-label="organization type"
                label={t('The tenant belongs to')}
                name="isCompany"
              >
                <RadioField
                  value="false"
                  label={t('A personal account')}
                  disabled={readOnly}
                />
                <RadioField
                  value="true"
                  label={t('A business or an institution')}
                  disabled={readOnly}
                />
              </RadioFieldGroup>
              {values.isCompany === 'true' && (
                <>
                  <FormTextField
                    label={t('Legal representative')}
                    name="legalRepresentative"
                    disabled={readOnly}
                  />
                  <FormTextField
                    label={t('Legal structure')}
                    name="legalStructure"
                    disabled={readOnly}
                  />
                  <FormTextField
                    label={t('Employer Identification Number')}
                    name="ein"
                    disabled={readOnly}
                  />
                  <FormTextField
                    label={t('Administrative jurisdiction')}
                    name="dos"
                    disabled={readOnly}
                  />
                  <FormTextField
                    label={t('Capital')}
                    name="capital"
                    disabled={readOnly}
                  />
                </>
              )}
            </FormSection>
            <FormSection label={t('Address')}>
              <AddressField disabled={readOnly} />
            </FormSection>
            <FormSection label={t('Contacts')}>
              <FieldArray
                name="contacts"
                render={(arrayHelpers) => (
                  <div>
                    {values.contacts.map((contact, index) => (
                      <Box key={index}>
                        <ContactForm
                          contactName={`contacts[${index}].contact`}
                          emailName={`contacts[${index}].email`}
                          phone1Name={`contacts[${index}].phone1`}
                          phone2Name={`contacts[${index}].phone2`}
                          disabled={readOnly}
                        />
                        {!readOnly && values.contacts.length > 1 && (
                          <Box pb={2} display="flex" justifyContent="flex-end">
                            <Button
                              // variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => arrayHelpers.remove(index)}
                            >
                              {t('Remove contact')}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ))}
                    {!readOnly && (
                      <Box display="flex" justifyContent="space-between">
                        <Button
                          // variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => arrayHelpers.push(emptyContact)}
                        >
                          {t('Add contact')}
                        </Button>
                      </Box>
                    )}
                  </div>
                )}
              />
            </FormSection>
            {!readOnly && (
              <SubmitButton
                size="large"
                label={!isSubmitting ? t('Save') : t('Saving')}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
});

export default TenantForm;
