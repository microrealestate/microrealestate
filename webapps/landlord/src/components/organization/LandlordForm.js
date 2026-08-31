import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import {
  RadioGroupField,
  RadioItem
} from '@microrealestate/commonui/components/formfields/RadioGroupField';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import cc from 'currency-codes';
import getSymbolFromCurrency from 'currency-symbol-map';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import {
  createOrganization,
  QueryKeys,
  updateOrganization
} from '../../utils/restcalls';
import { mergeOrganization, updateStoreOrganization } from './utils';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  locale: Yup.string().required(),
  currency: Yup.string().required(),
  isCompany: Yup.string().required(),
  legalStructure: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  company: Yup.mixed().when('isCompany', {
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
  capital: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.number().moreThan(0).required()
  })
});

const currencies = [
  ...cc.data
    .reduce((acc, { code, currency }) => {
      const symbol = getSymbolFromCurrency(code);
      if (symbol) {
        acc.push({
          code,
          currency,
          symbol
        });
      }
      return acc;
    }, [])
    .sort((c1, c2) => c1.currency.localeCompare(c2.currency))
    .map(({ code, currency, symbol }) => ({
      id: code,
      label: `${currency} (${symbol})`,
      value: code
    }))
];

const languages = [
  { id: 'pt-BR', label: 'Brasileiro', value: 'pt-BR' },
  { id: 'en', label: 'English', value: 'en' },
  { id: 'fr-FR', label: 'Français (France)', value: 'fr-FR' },
  { id: 'de-DE', label: 'Deutsch (Deutschland)', value: 'de-DE' },
  { id: 'es-CO', label: 'Español (Colombia)', value: 'es-CO' }
];

function LandlordForm({ organization }) {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutateCreateOrganization = useMutation({
    // no need to update the store on create as the user will be redirected
    mutationFn: createOrganization
  });
  const mutateUpdateOrganization = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (updatedOrganization) => {
      updateStoreOrganization(store, updatedOrganization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATION] });
    }
  });

  if (mutateCreateOrganization.isError) {
    toast.error(
      mutateCreateOrganization.error?.status === 409
        ? t(
            'An organization already exists. Ask its owner to add you as a collaborator.'
          )
        : t('Error creating organization')
    );
  }

  if (mutateUpdateOrganization.isError) {
    toast.error(
      mutateUpdateOrganization.error?.message ||
        t('Error updating organization')
    );
  }

  const initialValues = useMemo(
    () => ({
      name: organization?.name || '',
      locale: organization?.locale || '',
      currency: organization?.currency || '',
      isCompany: organization?.isCompany ? 'true' : 'false',
      legalRepresentative: organization?.companyInfo?.legalRepresentative || '',
      legalStructure: organization?.companyInfo?.legalStructure || '',
      company: organization?.companyInfo?.name || '',
      ein: organization?.companyInfo?.ein || '',
      dos: organization?.companyInfo?.dos || '',
      capital: organization?.companyInfo?.capital || ''
    }),
    [organization]
  );

  const onSubmit = async (landlord) => {
    if (!organization) {
      const newOrganization = {
        ...landlord,
        member1: {
          name: `${store.user.firstName} ${store.user.lastName}`,
          email: store.user.email
        }
      };
      let savedOrganization;
      try {
        savedOrganization = await mutateCreateOrganization.mutateAsync({
          store,
          organization: newOrganization
        });
      } catch {
        return;
      }

      // the domain is configured in its own step, which is skippable
      router.push('/setupdomain', { locale: savedOrganization.locale });
    } else {
      const updatedOrgPart = {
        name: landlord.name,
        isCompany: landlord.isCompany === 'true',
        currency: landlord.currency,
        locale: landlord.locale
      };

      if (updatedOrgPart.isCompany) {
        updatedOrgPart.companyInfo = {
          ...(organization.companyInfo || {}),
          name: landlord.company,
          ein: landlord.ein,
          dos: landlord.dos,
          legalRepresentative: landlord.legalRepresentative,
          legalStructure: landlord.legalStructure,
          capital: landlord.capital
        };
      }

      let savedOrganization;
      try {
        savedOrganization = await mutateUpdateOrganization.mutateAsync({
          store,
          organization: mergeOrganization(organization, {
            ...updatedOrgPart
          })
        });
      } catch {
        return;
      }

      // Redirect to the new organization landlord page if the organization name or locale has changed
      const isOrgNameChanged = savedOrganization.name !== initialValues.name;
      const isLocaleChanged = savedOrganization.locale !== initialValues.locale;
      if (isOrgNameChanged || isLocaleChanged) {
        router.push('/', { locale: savedOrganization.locale });
      }
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize={!organization}
    >
      {({ values }) => {
        return (
          <Form autoComplete="off" className="space-y-4">
            <TextField label={t('Name')} name="name" />
            <SelectField
              label={t('Language')}
              name="locale"
              values={languages}
            />
            <SelectField
              label={t('Currency')}
              name="currency"
              values={currencies}
            />
            <RadioGroupField label={t('The landlord is')} name="isCompany">
              <RadioItem
                name="isCompany-false"
                value="false"
                label={t('A personal account')}
                data-cy="companyFalse"
              />
              <RadioItem
                name="isCompany-true"
                value="true"
                label={t('A business or an institution')}
                data-cy="companyTrue"
              />
            </RadioGroupField>
            {values.isCompany === 'true' && (
              <>
                <TextField
                  label={t('Legal representative')}
                  name="legalRepresentative"
                />
                <TextField label={t('Legal structure')} name="legalStructure" />
                <TextField
                  label={t('Name of business or institution')}
                  name="company"
                />
                <TextField
                  label={t('Business registration number')}
                  name="ein"
                />
                <TextField label={t('Commercial register')} name="dos" />
                <NumberField label={t('Capital')} name="capital" />
              </>
            )}
            <SubmitButton label={t('Save')} />
          </Form>
        );
      }}
    </Formik>
  );
}

export default observer(LandlordForm);
