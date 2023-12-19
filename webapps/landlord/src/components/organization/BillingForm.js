import * as Yup from 'yup';

import {
  AddressField,
  ContactField,
  Section,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useCallback, useContext, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const BillingForm = observer(({ onSubmit }) => {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');

  const validationSchema = Yup.object().shape({
    vatNumber: store.organization.selected?.isCompany
      ? Yup.string().required()
      : Yup.string(),
    bankName: store.organization.selected?.isCompany
      ? Yup.string().required()
      : Yup.string(),
    iban: store.organization.selected?.isCompany
      ? Yup.string().required()
      : Yup.string(),
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
      country: Yup.string().required(),
    }),
  });

  const initialValues = useMemo(
    () => ({
      vatNumber: store.organization.selected?.companyInfo?.vatNumber || '',
      bankName: store.organization.selected?.bankInfo?.name || '',
      iban: store.organization.selected?.bankInfo?.iban || '',
      contact: store.organization.selected?.contacts?.[0]?.name || '',
      email: store.organization.selected?.contacts?.[0]?.email || '',
      phone1: store.organization.selected?.contacts?.[0]?.phone1 || '',
      phone2: store.organization.selected?.contacts?.[0]?.phone2 || '',
      address: store.organization.selected?.addresses?.[0] || {
        street1: '',
        street2: '',
        city: '',
        zipCode: '',
        state: '',
        country: '',
      },
    }),
    [store.organization.selected]
  );

  const _onSubmit = useCallback(
    async (billing) => {
      await onSubmit({
        companyInfo: {
          ...store.organization.selected.companyInfo,
          vatNumber: billing.vatNumber,
        },
        bankInfo: {
          name: billing.bankName,
          iban: billing.iban,
        },
        contacts: [
          {
            name: billing.contact,
            email: billing.email,
            phone1: billing.phone1,
            phone2: billing.phone2,
          },
        ],
        addresses: [billing.address],
      });
    },
    [onSubmit, store.organization.selected.companyInfo]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={_onSubmit}
    >
      {({ isSubmitting }) => {
        return (
          <Form autoComplete="off">
            <Section label={t('Billing information')}>
              {store.organization.selected &&
                store.organization.selected.isCompany && (
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
});

export default BillingForm;
