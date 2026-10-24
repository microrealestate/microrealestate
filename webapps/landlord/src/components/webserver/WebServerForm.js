'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  canDisableIpAccess,
  canEnableHttps,
  cleanDomain,
  isValidDomain
} from '@microrealestate/shared';
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
import ConfirmDialog from '../ConfirmDialog';
import {
  mergeOrganization,
  updateStoreOrganization
} from '../organization/utils';

function _validationSchema() {
  return Yup.object().shape({
    domain: Yup.string().domain(),
    httpsEnabled: Yup.boolean(),
    acmeEmail: Yup.string()
      .email()
      .when(['httpsEnabled', 'domain'], (httpsEnabled, domain, schema) =>
        httpsEnabled && canEnableHttps(domain) ? schema.required() : schema
      )
  });
}

function _buildTargetUrl({ domain, httpsEnabled }) {
  const protocol = httpsEnabled ? 'https:' : window.location.protocol;
  const hasPort = /:\d+$/.test(domain);
  const port = httpsEnabled || hasPort ? '' : window.location.port;
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${domain}${portSuffix}${BASE_PATH}`;
}

// What the reverse proxy can serve for the typed domain. The form values keep
// the user's choices, so a domain that is invalid while being typed does not
// reset them; only these effective values are shown and saved.
function _effective(values, savedDomain) {
  const httpsAllowed = canEnableHttps(values.domain);
  const ipAccessForced = !canDisableIpAccess(values.domain);
  // the api keeps IP access on for a domain it has not served yet
  const domainChanged =
    cleanDomain(values.domain || '') !== (savedDomain || '');
  return {
    httpsAllowed,
    ipAccessForced,
    domainChanged,
    httpsEnabled: !!values.httpsEnabled && httpsAllowed,
    ipAccessEnabled: !!values.ipAccessEnabled || ipAccessForced || domainChanged
  };
}

function FormSideEffects({ onDirtyChange }) {
  const { dirty } = useFormikContext();

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
  const externalProxy = organization?.reverseProxy === 'external';
  const [isDirty, setIsDirty] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  const savedDomain = webServer?.domain;
  const externalUrl =
    externalProxy && savedDomain
      ? `${webServer.httpsEnabled ? 'https' : 'http'}://${savedDomain}`
      : null;
  const domainUrl = externalUrl
    ? `${externalUrl}${BASE_PATH}`
    : savedDomain
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

  // The check pauses, and reports reachable, while the form is edited: keep
  // the result it gave for the saved configuration
  const [domainReachable, setDomainReachable] = useState(false);
  useEffect(() => {
    if (!isDirty) {
      setDomainReachable(connectivity === 'reachable');
    }
  }, [isDirty, connectivity]);

  const handleDirtyChange = (dirty) => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  };

  const initialValues = {
    domain: externalUrl || webServer?.domain || '',
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

  const save = async (values) => {
    const effective = _effective(values, savedDomain);
    await mutate.mutateAsync({
      store,
      organization: mergeOrganization(organization, {
        webServer: {
          domain: cleanDomain(values.domain),
          acmeEmail: effective.httpsEnabled
            ? values.acmeEmail?.trim() || undefined
            : undefined,
          httpsEnabled: effective.httpsEnabled,
          ipAccessEnabled: effective.ipAccessEnabled
        }
      })
    });
  };

  // Turning IP access off leaves the domain as the only way in: confirm before saving
  const onSubmit = async (values) => {
    if (
      initialValues.ipAccessEnabled &&
      !_effective(values, savedDomain).ipAccessEnabled
    ) {
      setPendingValues(values);
      return;
    }
    await save(values);
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        // shows a domain error while typing, not only after blur
        initialTouched={{ domain: true }}
        validationSchema={externalProxy ? undefined : _validationSchema()}
        enableReinitialize
        onSubmit={onSubmit}
      >
        {({ dirty, isValid, values }) => {
          const effective = _effective(values, savedDomain);
          const ipAccessLocked =
            effective.ipAccessEnabled &&
            (effective.ipAccessForced ||
              effective.domainChanged ||
              !domainReachable);
          // the domain field's own error explains why the switches are off
          const domainInvalid =
            !!values.domain?.trim() && !isValidDomain(values.domain);
          return (
            <Form autoComplete="off" className="space-y-6">
              <FormSideEffects onDirtyChange={handleDirtyChange} />
              <TextField
                label={t('Domain')}
                name="domain"
                readOnly={externalProxy}
                description={
                  externalProxy
                    ? t(
                        'Set by MRE_URL in the .env file of the server. To change it, edit .env, then run ./install.sh update.'
                      )
                    : t(
                        'The address used to open the application, as a domain name or an IP address. Emails such as receipts and password resets contain links to this address.'
                      )
                }
                data-cy="domainInput"
              />
              {!externalProxy && (
                <>
                  <div className="space-y-2">
                    <SwitchField
                      name="httpsEnabled"
                      label={t('HTTPS Automatically provision SSL Certificate')}
                      checked={effective.httpsEnabled}
                      disabled={!effective.httpsAllowed}
                      data-cy="httpsSwitch"
                    />
                    {!effective.httpsAllowed && !domainInvalid && (
                      <p
                        className="text-sm text-muted-foreground"
                        data-cy="httpsHint"
                      >
                        {t(
                          'HTTPS requires a public domain name without a port.'
                        )}
                      </p>
                    )}
                  </div>
                  {effective.httpsEnabled && (
                    <TextField
                      label={t('Email')}
                      name="acmeEmail"
                      description={t(
                        'Receives notices about the SSL certificate, such as its expiry.'
                      )}
                      data-cy="emailInput"
                    />
                  )}
                  <div className="space-y-2 pt-6">
                    <SwitchField
                      name="ipAccessEnabled"
                      label={t(
                        "Also allow direct access via the server's IP address"
                      )}
                      checked={effective.ipAccessEnabled}
                      disabled={ipAccessLocked}
                      data-cy="ipAccessSwitch"
                    />
                    {ipAccessLocked && !domainInvalid && (
                      <p
                        className="text-sm text-muted-foreground"
                        data-cy="ipAccessLockedHint"
                      >
                        {effective.ipAccessForced
                          ? t(
                              'Always on when the domain is empty, an IP address or localhost.'
                            )
                          : t(
                              'Save the domain and check that it is reachable before turning this off.'
                            )}
                      </p>
                    )}
                    {!ipAccessLocked && (
                      <p
                        className="flex items-center gap-2 text-sm font-medium text-warning"
                        data-cy="ipAccessHint"
                      >
                        <LuTriangleAlert className="size-4 shrink-0" />
                        {t(
                          'Turning this off can make the application unreachable if the domain does not work.'
                        )}
                      </p>
                    )}
                  </div>
                </>
              )}
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
              {!externalProxy && (
                <div className="flex gap-4 pt-2">
                  <SubmitButton
                    data-cy="submitDomain"
                    label={submitLabel || t('Update')}
                    disabled={!dirty || !isValid}
                  />
                </div>
              )}
            </Form>
          );
        }}
      </Formik>
      <ConfirmDialog
        title={t('Turn off access via the IP address?')}
        subTitle={t(
          'After saving, the application is only reachable at {domain}. If this domain does not work, you will lose access to the application.',
          { domain: cleanDomain(pendingValues?.domain || '') }
        )}
        open={!!pendingValues}
        setOpen={(open) => {
          if (!open) {
            setPendingValues(null);
          }
        }}
        data={pendingValues}
        onConfirm={(values) => save(values).catch(() => {})}
      />
    </>
  );
}
