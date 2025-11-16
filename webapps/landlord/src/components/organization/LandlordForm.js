import * as Yup from 'yup';
import {
  createOrganization,
  QueryKeys,
  updateOrganization
} from '../../utils/restcalls';
import { Form, Formik } from 'formik';
import { mergeOrganization, updateStoreOrganization } from './utils';
import {
  NumberField,
  RadioField,
  RadioFieldGroup,
  SelectField,
  SubmitButton,
  TextField,
  UploadField
} from '@microrealestate/commonui/components';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import cc from 'currency-codes';
import config from '../../config';
import getSymbolFromCurrency from 'currency-symbol-map';
import SignatureThumbnail from './SignatureThumbnail';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import { uploadDocument } from '../../utils/fetch';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

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
  { id: 'none', label: '', value: '' },
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
  { id: 'none', label: '', value: '' },
  { id: 'pt-BR', label: 'Brasileiro', value: 'pt-BR' },
  { id: 'en', label: 'English', value: 'en' },
  { id: 'fr-FR', label: 'Français (France)', value: 'fr-FR' },
  { id: 'de-DE', label: 'Deutsch (Deutschland)', value: 'de-DE' },
  { id: 'es-CO', label: 'Español (Colombia)', value: 'es-CO' }
];

// Create a hash from file attributes to uniquely identify files
const createFileHash = (file) => {
  if (!file || typeof file !== 'object') return null;

  return `${file.lastModified}-${file.name}-${file.size}-${file.type}`;
};

export default function LandlordForm({ organization, firstAccess }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureRemoving, setSignatureRemoving] = useState(false);
  const lastSignatureHashRef = useRef(null);

  const mutateCreateOrganization = useMutation({
    mutationFn: createOrganization,
    onSuccess: (createdOrgpanization) => {
      updateStoreOrganization(store, createdOrgpanization);
    }
  });
  const mutateUpdateOrganization = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (updatedOrganization) => {
      updateStoreOrganization(store, updatedOrganization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATIONS] });
    }
  });

  const handleRemoveSignature = useCallback(async () => {
    try {
      setSignatureRemoving(true);
      await mutateUpdateOrganization.mutateAsync({
        store,
        organization: mergeOrganization(organization, { signature: '' })
      });
      await store.document.delete([organization.signature]);

      // Reset ref to allow future uploads
      lastSignatureHashRef.current = null;
    } catch (error) {
      console.error(error);
      toast.error(t('Cannot remove signature'));
    } finally {
      setSignatureRemoving(false);
    }
  }, [store, organization, mutateUpdateOrganization, t]);

  if (mutateCreateOrganization.isError) {
    toast.error(t('Error creating organization'));
  }

  if (mutateUpdateOrganization.isError) {
    toast.error(t('Error updating organization'));
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
      capital: organization?.companyInfo?.capital || '',
      signature: organization?.signature
    }),
    [organization]
  );

  const onSubmit = useCallback(
    async (landlord) => {
      let signatureId;
      // Only upload if it's a new file (check hash of file attributes against ref)
      const isSignatureChanged =
        typeof landlord.signature === 'object' &&
        createFileHash(landlord.signature) !== lastSignatureHashRef.current;
      if (isSignatureChanged) {
        try {
          setSignatureUploading(true);
          // TODO rework POST /documents/upload endpoint to automatically create
          // the associated document (POST /documents)
          const response = await uploadDocument({
            endpoint: '/documents/upload',
            documentName: `signature_${Date.now()}`,
            file: landlord.signature,
            folder: 'signatures'
          });
          const { status, data: signatureDocument } =
            await store.document.create({
              type: 'file',
              name: response.data.fileName,
              url: response.data.key,
              mimeType: landlord.signature.type
            });

          signatureId = signatureDocument._id;

          // Update ref to track this file's hash
          if (typeof landlord.signature === 'object') {
            lastSignatureHashRef.current = createFileHash(landlord.signature);
          }

          if (status !== 200) {
            throw new Error('Failed to upload signature');
          }
        } catch (error) {
          console.error(error);
          signatureId = null;
          toast.error(t('Cannot upload signature'));
        } finally {
          setSignatureUploading(false);
        }
      } else {
        // Keep existing signature (UUID) or set to null if no signature
        signatureId = organization.signature || null;
      }

      if (firstAccess) {
        const createdOrgpanization = {
          ...landlord,
          members: [
            {
              name: `${store.user.firstName} ${store.user.lastName}`,
              email: store.user.email,
              role: 'administrator',
              registered: true
            }
          ]
        };
        await mutateCreateOrganization.mutateAsync({
          store,
          organization: createdOrgpanization
        });
        router.push(
          `/${store.organization.selected.name}/dashboard`,
          undefined,
          {
            locale: store.organization.selected.locale
          }
        );
      } else {
        const updatedOrgPart = {
          name: landlord.name,
          isCompany: landlord.isCompany === 'true',
          currency: landlord.currency,
          locale: landlord.locale,
          signature: signatureId
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

        const savedOrganization = await mutateUpdateOrganization.mutateAsync({
          store,
          organization: mergeOrganization(organization, {
            ...updatedOrgPart
          })
        });

        // Redirect to the new organization landlord page if the organization name or locale has changed
        const isOrgNameChanged = savedOrganization.name !== initialValues.name;
        const isLocaleChanged =
          savedOrganization.locale !== initialValues.locale;
        if (isOrgNameChanged || isLocaleChanged) {
          window.location.assign(
            `${config.BASE_PATH}/${savedOrganization.locale}/${savedOrganization.name}/settings/landlord`
          );
        }
      }
    },
    [
      firstAccess,
      store,
      t,
      mutateCreateOrganization,
      router,
      mutateUpdateOrganization,
      organization,
      initialValues.name,
      initialValues.locale
    ]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting }) => {
        return (
          <Form autoComplete="off">
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
            <RadioFieldGroup
              aria-label="organization type"
              label={t('The organization/landlord belongs to')}
              name="isCompany"
            >
              <RadioField
                value="false"
                label={t('A personal account')}
                data-cy="companyFalse"
              />
              <RadioField
                value="true"
                label={t('A business or an institution')}
                data-cy="companyTrue"
              />
            </RadioFieldGroup>
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
                  label={t('Employer Identification Number')}
                  name="ein"
                />
                <TextField
                  label={t('Administrative jurisdiction')}
                  name="dos"
                />
                <NumberField label={t('Capital')} name="capital" />
              </>
            )}
            <SignatureThumbnail
              signature={organization.signature}
              onRemove={handleRemoveSignature}
              disabled={signatureRemoving || isSubmitting}
              className="mt-2"
            />
            {!organization?.signature ? (
              <UploadField
                label={t('Signature')}
                name="signature"
                accept="image/*,.svg"
                disabled={signatureUploading || signatureRemoving}
              />
            ) : null}
            <SubmitButton
              size="large"
              label={!isSubmitting ? t('Save') : t('Saving')}
              disabled={signatureUploading || signatureRemoving}
            />
          </Form>
        );
      }}
    </Formik>
  );
}
