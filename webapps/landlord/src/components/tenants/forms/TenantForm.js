import {
  AddressField,
  ContactField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import {
  emptyContact,
  initValues,
  validate,
  validationSchema
} from './tenantFormSchema';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { ArrayField } from '../../formfields/ArrayField';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';
export { validate };

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
        }),
      invoiceEmail: tenant.invoiceEmail || ''
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
              <ArrayField
                name="contacts"
                addLabel={t('Add a contact')}
                emptyItem={emptyContact}
                items={values.contacts}
                readOnly={readOnly}
                renderTitle={(contact, index) =>
                  t('Contact #{{count}}', { count: index + 1 })
                }
                renderContent={(contact, index) => (
                  <ContactField
                    contactName={`contacts[${index}].contact`}
                    emailName={`contacts[${index}].email`}
                    phone1Name={`contacts[${index}].phone1`}
                    phone2Name={`contacts[${index}].phone2`}
                    disabled={readOnly}
                  />
                )}
              />
              <TextField
                label={t('Invoice email (optional)')}
                name="invoiceEmail"
                disabled={readOnly}
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
