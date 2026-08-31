import { AddressField } from '@microrealestate/commonui/components/formfields/AddressField';
import { ContactField } from '@microrealestate/commonui/components/formfields/ContactField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import { QueryKeys, updateOrganization } from '../../utils/restcalls';
import { mergeOrganization, updateStoreOrganization } from './utils';

export default function BillingForm({ organization }) {
  const store = useStore();
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const { mutateAsync, isError } = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (updatedOrganization) => {
      updateStoreOrganization(store, updatedOrganization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATION] });
    }
  });

  if (isError) {
    toast.error(t('Error updating organization'));
  }

  const validationSchema = Yup.object().shape({
    vatNumber: organization.isCompany ? Yup.string().required() : Yup.string(),
    bankInfo: Yup.object().shape({
      name: organization.isCompany ? Yup.string().required() : Yup.string(),
      iban: organization.isCompany ? Yup.string().required() : Yup.string()
    }),
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
      bankInfo: {
        name: organization.bankInfo?.name || '',
        iban: organization.bankInfo?.iban || ''
      },
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
          name: billing.bankInfo.name,
          iban: billing.bankInfo.iban
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
      {() => {
        return (
          <Form autoComplete="off">
            <Section>
              {organization?.isCompany && (
                <TextField label={t('VAT number')} name="vatNumber" />
              )}
              <TextField label={t('Bank name')} name="bankInfo.name" />
              <TextField label={t('IBAN')} name="bankInfo.iban" />
            </Section>
            <Section label={t('Contact')}>
              <ContactField />
            </Section>
            <Section label={t('Address')}>
              <AddressField />
            </Section>

            <SubmitButton label={t('Save')} />
          </Form>
        );
      }}
    </Formik>
  );
}
