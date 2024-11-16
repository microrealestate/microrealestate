import * as Yup from 'yup';
import {
  AddressField,
  ContactField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { FieldArray, Form, Formik } from 'formik';
import { LuPlusCircle, LuTrash } from 'react-icons/lu';
import { useContext, useMemo } from 'react';
import { Button } from '../../ui/button';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

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
      contact: Yup.string().required(),
      email: Yup.string().email().required(),
      phone1: Yup.string(),
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

const emptyContact = { contact: '', email: '', phone1: '', phone2: '' };

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
      ? tenant.contacts.map(({ contact, email, phone, phone1, phone2 }) => ({
          contact,
          email,
          phone1: phone1 || phone,
          phone2: phone2 || ''
        }))
      : [emptyContact],
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
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

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
        .filter(({ contact }) => !!contact)
        .map(({ contact, email, phone1, phone2 }) => {
          return {
            contact,
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
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section
              label={t('Tenant information')}
              visible={!store.tenant.selected.stepperMode}
            >
              <TextField label={t('Name')} name="name" disabled={readOnly} />
              <RadioFieldGroup
                aria-label="organization type"
                label={t('The tenant belongs to')}
                name="isCompany"
              >
                <RadioField
                  value="false"
                  label={t('A personal account')}
                  disabled={readOnly}
                  data-cy="tenantIsPersonalAccount"
                />
                <RadioField
                  value="true"
                  label={t('A business or an institution')}
                  disabled={readOnly}
                  data-cy="tenantIsBusinessAccount"
                />
              </RadioFieldGroup>
              {values.isCompany === 'true' && (
                <>
                  <TextField
                    label={t('Legal representative')}
                    name="legalRepresentative"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Legal structure')}
                    name="legalStructure"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Employer Identification Number')}
                    name="ein"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Administrative jurisdiction')}
                    name="dos"
                    disabled={readOnly}
                  />
                  <TextField
                    label={t('Capital')}
                    name="capital"
                    disabled={readOnly}
                  />
                </>
              )}
            </Section>
            <Section label={t('Address')}>
              <AddressField disabled={readOnly} />
            </Section>
            <Section
              label={t('Contacts')}
              description={t(
                "The contacts will receive the invoices and will be able to access the tenant's portal"
              )}
            >
              <FieldArray
                name="contacts"
                render={(arrayHelpers) => (
                  <div>
                    {values.contacts.map((contact, index) => (
                      <div key={index}>
                        <ContactField
                          contactName={`contacts[${index}].contact`}
                          emailName={`contacts[${index}].email`}
                          phone1Name={`contacts[${index}].phone1`}
                          phone2Name={`contacts[${index}].phone2`}
                          disabled={readOnly}
                        />
                        {!readOnly && values.contacts.length > 1 && (
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => arrayHelpers.remove(index)}
                              className="gap-1 text-xs text-muted-foreground"
                              data-cy="removeTenantContact"
                            >
                              <LuTrash className="size-4" />
                              {t('Remove contact')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => arrayHelpers.push(emptyContact)}
                        className="gap-1 text-xs text-muted-foreground"
                        data-cy="addTenantContact"
                      >
                        <LuPlusCircle className="size-4" />
                        {t('Add contact')}
                      </Button>
                    )}
                  </div>
                )}
              />
            </Section>
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
