'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { cleanDomain } from '@microrealestate/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik, useFormikContext } from 'formik';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { LuCheck, LuRotateCw, LuTriangleAlert } from 'react-icons/lu';
import { toast } from 'sonner';
import * as Yup from 'yup';
import useUrlConnectivity from '@/hooks/useUrlConnectivity';
import { useStore } from '@/providers/StoreProvider';
import { BASE_PATH } from '@/utils/basepath';
import { QueryKeys, updateOrganization } from '../../utils/restcalls';
import {
  mergeOrganization,
  updateStoreOrganization
} from '../organization/utils';

const validationSchema = Yup.object().shape({
  domain: Yup.string().domain(),
  httpsEnabled: Yup.boolean(),
  acmeEmail: Yup.string().email().when('httpsEnabled', {
    is: true,
    then: Yup.string().email().required()
  })
});

function _buildTargetUrl({ domain, httpsEnabled }) {
  const protocol = httpsEnabled ? 'https:' : window.location.protocol;
  const port = httpsEnabled ? '' : window.location.port;
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${domain}${portSuffix}${BASE_PATH}`;
}

function FormSideEffects({ onDirtyChange }) {
  const { values, dirty, setFieldValue } = useFormikContext();
  const isDomainEmpty = !values.domain?.trim();

  useEffect(() => {
    if (isDomainEmpty && values.httpsEnabled) {
      setFieldValue('httpsEnabled', false);
    }
  }, [isDomainEmpty, values.httpsEnabled, setFieldValue]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  return null;
}

export default function WebServerForm({
  organization,
  submitLabel,
  onSuccess,
  onDirtyChange
}) {
  const t = useTranslations('common');
  const store = useStore();
  const queryClient = useQueryClient();
  const webServer = organization?.webServer;
  const [isDirty, setIsDirty] = useState(false);

  const savedDomain = webServer?.domain;
  const domainUrl = savedDomain
    ? _buildTargetUrl({
        domain: savedDomain,
        httpsEnabled: !!webServer.httpsEnabled
      })
    : null;

  const {
    status: connectivity,
    attempt,
    maxAttempts,
    retry
  } = useUrlConnectivity(domainUrl, {
    enabled: !!savedDomain && !isDirty
  });

  const handleDirtyChange = (dirty) => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  };

  const initialValues = {
    domain: webServer?.domain || '',
    acmeEmail: webServer?.acmeEmail || '',
    httpsEnabled: webServer?.httpsEnabled || false,
    ipAccessEnabled: webServer?.ipAccessEnabled ?? true
  };

  const mutate = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (savedOrganization) => {
      updateStoreOrganization(store, savedOrganization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATION] });
      toast.success(t('Domain updated'));

      onSuccess?.(savedOrganization);
    },
    onError: (error) => {
      toast.error(error?.message || t('Error updating domain'));
    }
  });

  const onSubmit = async (values) => {
    await mutate.mutateAsync({
      store,
      organization: mergeOrganization(organization, {
        webServer: {
          domain: cleanDomain(values.domain),
          acmeEmail: values.acmeEmail?.trim() || undefined,
          httpsEnabled: !!values.httpsEnabled,
          ipAccessEnabled: !!values.ipAccessEnabled
        }
      })
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({ dirty }) => (
        <Form autoComplete="off" className="space-y-6">
          <FormSideEffects onDirtyChange={handleDirtyChange} />
          <TextField label={t('Domain')} name="domain" data-cy="domainInput" />
          <TextField label={t('Email')} name="acmeEmail" data-cy="emailInput" />
          <SwitchField
            name="httpsEnabled"
            label={t('HTTPS Automatically provision SSL Certificate')}
            data-cy="httpsSwitch"
          />
          <div className="my-10 -mx-4 p-4 border rounded border-warning">
            <SwitchField
              name="ipAccessEnabled"
              label={t("Also allow direct access via the server's IP address")}
              data-cy="ipAccessSwitch"
            />
            <p className="text-muted-foreground text-sm">
              {t(
                'Disabling this will stop direct IP address access to the server.'
              )}
            </p>
          </div>
          {savedDomain && !dirty && connectivity === 'checking' && (
            <p
              className="text-sm text-muted-foreground flex items-center gap-2 mt-2"
              data-cy="ipAccessChecking"
            >
              <LuRotateCw className="size-4 animate-spin" />
              {t(
                'Checking connectivity to {domain}... (attempt {attempt} of {total})',
                {
                  domain: savedDomain,
                  attempt: Math.min(attempt || 1, maxAttempts),
                  total: maxAttempts
                }
              )}
            </p>
          )}
          {savedDomain && !dirty && connectivity === 'unreachable' && (
            <div className="flex gap-2" data-cy="ipAccessUnreachable">
              <p className="text-sm font-medium text-warning flex items-center gap-2">
                <LuTriangleAlert className="size-5" />
                {t('{domain} is not reachable', { domain: savedDomain })}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={retry}
                data-cy="retryConnectivity"
              >
                <LuRotateCw />
                {t('Try again')}
              </Button>
            </div>
          )}
          {savedDomain &&
            !dirty &&
            connectivity === 'reachable' &&
            domainUrl && (
              <a
                href={domainUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cy="newDomainLink"
                className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
              >
                <LuCheck className="size-5 text-success" />
                {domainUrl}
              </a>
            )}
          <div className="flex gap-4 pt-2">
            <SubmitButton
              data-cy="submitDomain"
              label={submitLabel || t('Update')}
              disabled={!dirty}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
