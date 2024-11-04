import * as Yup from 'yup';
import {
  AddressField,
  ContactField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { mergeOrganization, updateStoreOrganization } from './utils';
import { QueryKeys, updateOrganization } from '../../utils/restcalls';
import { useCallback, useContext, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

export default function BillingForm({ organization }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { mutateAsync, isError } = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (updatedOrganization) => {
      updateStoreOrganization(store, updatedOrganization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATIONS] });
    }
  });

  if (isError) {
    toast.error(t('Error updating organization'));
  }

  const validationSchema = Yup.object().shape({
    vatNumber: organization.isCompany ? Yup.string().required() : Yup.string(),
    bankName: organization.isCompany ? Yup.string().required() : Yup.string(),
    iban: organization.isCompany ? Yup.string().required() : Yup.string(),
    contact: Yup.string().required(),
    email: Yup.string().email().required(),
    phone1: Yup.string().required(),
    phone2: Yup.string(),
    address: Yup.object().shape({
      street1: Yup.string().required(),
      street2: Yup.string(),
      city: Yup.string().required(),
      zipCode: Yup.string().required(),
      state: Yup.string(),
      country: Yup.string().required()
    })
  });

  const initialValues = useMemo(
    () => ({
      vatNumber: organization.companyInfo?.vatNumber || '',
      bankName: organization.bankInfo?.name || '',
      iban: organization.bankInfo?.iban || '',
      contact: organization.contacts?.[0]?.name || '',
      email: organization.contacts?.[0]?.email || '',
      phone1: organization.contacts?.[0]?.phone1 || '',
      phone2: organization.contacts?.[0]?.phone2 || '',
      address: organization.addresses?.[0] || {
        street1: '',
        street2: '',
        city: '',
        zipCode: '',
        state: '',
        country: ''
      }
    }),
    [organization]
  );

  const onSubmit = useCallback(
    async (billing) => {
      const updatedOrganization = mergeOrganization(organization, {
        companyInfo: {
          ...organization.companyInfo,
          vatNumber: billing.vatNumber
        },
        bankInfo: {
          name: billing.bankName,
          iban: billing.iban
        },
        contacts: [
          {
            name: billing.contact,
            email: billing.email,
            phone1: billing.phone1,
            phone2: billing.phone2
          }
        ],
        addresses: [billing.address]
      });
      await mutateAsync({ store, organization: updatedOrganization });
    },
    [mutateAsync, organization, store]
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
            <Section>
              {organization?.isCompany && (
                <TextField label={t('VAT number')} name="vatNumber" />
              )}
              <TextField label={t('Bank name')} name="bankName" />
              <TextField label={t('IBAN')} name="iban" />
            </Section>
            <Section label={t('Contact')}>
              <ContactField />
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
}
