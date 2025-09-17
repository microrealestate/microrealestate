import * as Yup from 'yup';
import {
  createOrganization,
  QueryKeys,
  updateOrganization
} from '../../utils/restcalls';
import { apiFetcher } from '../../utils/fetch';
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
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import cc from 'currency-codes';
import config from '../../config';
import getSymbolFromCurrency from 'currency-symbol-map';
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

// Component to handle authenticated signature thumbnail display
function SignatureThumbnail({ signature, alt }) {
  const { t } = useTranslation('common');
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchSignatureImage = async () => {
      try {
        // Extract filename from the full path
        const filename = signature.split('/').pop() || signature;
        const response = await apiFetcher().get(
          `/documents/signature/${encodeURIComponent(filename)}`,
          {
            responseType: 'blob'
          }
        );

        // Create a blob URL for the image
        const imageUrl = URL.createObjectURL(response.data);
        setImageSrc(imageUrl);
      } catch (error) {
        console.error('Failed to load signature image:', error);
        setHasError(true);
      }
    };

    if (signature) {
      fetchSignatureImage();
    }

    // Cleanup blob URL when component unmounts
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [signature]);

  return (
    <div className="flex items-center justify-center min-h-16 max-h-16 min-w-32 max-w-32 border border-border rounded bg-white p-2">
      {!hasError && imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="text-xs text-muted-foreground text-center">
          📝
          <br />
          {t('Signature uploaded')}
        </div>
      )}
    </div>
  );
}

export default function LandlordForm({ organization, firstAccess }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureRemoving, setSignatureRemoving] = useState(false);
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
  const removeSignature = useCallback(async () => {
    try {
      setSignatureRemoving(true);
      
      const updatedOrgPart = {
        signature: '' // Clear the signature
      };

      await mutateUpdateOrganization.mutateAsync({
        store,
        organization: mergeOrganization(organization, updatedOrgPart)
      });
      
      toast.success(t('Signature removed successfully'));
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
      signature: null
    }),
    [organization]
  );

  const onSubmit = useCallback(
    async (landlord) => {
      // Handle signature upload if present
      let signatureUrl = organization?.signature || '';
      if (landlord.signature) {
        try {
          setSignatureUploading(true);
          const response = await uploadDocument({
            endpoint: '/documents/upload',
            documentName: `signature_${Date.now()}`,
            file: landlord.signature,
            folder: 'signatures'
          });
          signatureUrl = response.data.key;
        } catch (error) {
          console.error(error);
          toast.error(t('Cannot upload signature'));
          return;
        } finally {
          setSignatureUploading(false);
        }
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
          signature: signatureUrl
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
            <div className="mt-6">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('Signature')}
              </label>
              <div className="text-xs text-muted-foreground mt-1 mb-2">
                {t(
                  'Upload your signature image or SVG to be included in documents'
                )}
              </div>
              {organization?.signature && (
                <div className="mb-4 p-3 border border-border rounded-lg bg-muted/50">
                  <div className="text-xs text-green-600 mb-2">
                    {t('Current signature:')}
                  </div>
                  <div className="flex items-center gap-3">
                    <SignatureThumbnail
                      signature={organization.signature}
                      alt={t('Current signature')}
                    />
                    <div className="flex-1 text-xs text-muted-foreground">
                      {t('Your signature will appear in generated documents')}
                    </div>
                    <button
                      type="button"
                      onClick={removeSignature}
                      disabled={signatureRemoving || isSubmitting}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded transition-colors"
                    >
                      {signatureRemoving ? t('Removing...') : t('Remove')}
                    </button>
                  </div>
                </div>
              )}
              <UploadField
                name="signature"
                accept="image/*,.svg"
                disabled={signatureUploading || signatureRemoving}
              />
            </div>
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
