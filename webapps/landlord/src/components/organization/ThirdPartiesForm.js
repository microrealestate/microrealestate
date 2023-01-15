import * as Yup from 'yup';

import { Box, Link } from '@material-ui/core';
import { Form, Formik } from 'formik';
import {
  RadioField,
  RadioFieldGroup,
  Section,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { useCallback, useContext, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  emailDeliveryServiceActive: Yup.boolean().required(),
  emailDeliveryServiceName: Yup.string().required(),

  gmail_email: Yup.string().when('emailDeliveryServiceName', {
    is: 'gmail',
    then: Yup.string().email().required(),
  }),
  gmail_appPassword: Yup.string().when('emailDeliveryServiceName', {
    is: 'gmail',
    then: Yup.string().required(),
  }),

  mailgun_apiKey: Yup.string().when('emailDeliveryServiceName', {
    is: 'mailgun',
    then: Yup.string().required(),
  }),
  mailgun_domain: Yup.string().when('emailDeliveryServiceName', {
    is: 'mailgun',
    then: Yup.string().required(),
  }),

  fromEmail: Yup.string().email().when('emailDeliveryServiceActive', {
    is: true,
    then: Yup.string().email().required(),
  }),
  replyToEmail: Yup.string().email().when('emailDeliveryServiceActive', {
    is: true,
    then: Yup.string().email().required(),
  }),

  b2Active: Yup.boolean().required(),
  keyId: Yup.string().when('b2Active', {
    is: true,
    then: Yup.string().required(),
  }),
  applicationKey: Yup.string().when('b2Active', {
    is: true,
    then: Yup.string().required(),
  }),
  endpoint: Yup.string().when('b2Active', {
    is: true,
    then: Yup.string().required(),
  }),
  bucket: Yup.string().when('b2Active', {
    is: true,
    then: Yup.string().required(),
  }),
});

const ThirdPartiesForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(() => {
    let emailDeliveryServiceName;
    let fromEmail;
    let replyToEmail;

    if (store.organization.selected.thirdParties?.gmail?.selected) {
      emailDeliveryServiceName = 'gmail';
      fromEmail = store.organization.selected?.contacts?.[0]?.email || '';
      replyToEmail = store.organization.selected?.contacts?.[0]?.email || '';
    }
    if (store.organization.selected.thirdParties?.mailgun?.selected) {
      emailDeliveryServiceName = 'mailgun';
      fromEmail =
        store.organization.selected.thirdParties?.mailgun?.fromEmail || '';
      replyToEmail =
        store.organization.selected.thirdParties?.mailgun?.replyToEmail || '';
    }

    return {
      emailDeliveryServiceActive: !!emailDeliveryServiceName,
      emailDeliveryServiceName,
      gmail_email: store.organization.selected.thirdParties?.gmail?.email || '',
      gmail_appPassword:
        store.organization.selected.thirdParties?.gmail?.appPassword || '',

      mailgun_apiKey:
        store.organization.selected.thirdParties?.mailgun?.apiKey || '',
      mailgun_domain:
        store.organization.selected.thirdParties?.mailgun?.domain || '',

      fromEmail,
      replyToEmail,

      b2Active: !!store.organization.selected.thirdParties?.b2?.keyId,
      keyId: store.organization.selected.thirdParties?.b2?.keyId,
      applicationKey:
        store.organization.selected.thirdParties?.b2?.applicationKey,
      endpoint: store.organization.selected.thirdParties?.b2?.endpoint,
      bucket: store.organization.selected.thirdParties?.b2?.bucket,
    };
  }, [store.organization.selected]);

  const _onSubmit = useCallback(
    async ({
      emailDeliveryServiceActive,
      emailDeliveryServiceName,
      gmail_email,
      gmail_appPassword,
      mailgun_apiKey,
      mailgun_domain,
      fromEmail,
      replyToEmail,
      b2Active,
      keyId,
      applicationKey,
      endpoint,
      bucket,
    }) => {
      const formData = { thirdParties: {} };
      if (emailDeliveryServiceActive) {
        formData.thirdParties.gmail = {
          selected: emailDeliveryServiceName === 'gmail',
          email: gmail_email,
          appPassword: gmail_appPassword,
          appPasswordUpdated:
            gmail_appPassword !== initialValues.gmail_appPassword,
          fromEmail,
          replyToEmail,
        };

        formData.thirdParties.mailgun = {
          selected: emailDeliveryServiceName === 'mailgun',
          apiKey: mailgun_apiKey,
          apiKeyUpdated: mailgun_apiKey !== initialValues.mailgun_apiKey,
          domain: mailgun_domain,
          fromEmail,
          replyToEmail,
        };
      }
      if (b2Active) {
        formData.thirdParties.b2 = {
          keyId,
          applicationKey,
          keyIdUpdated: keyId !== initialValues.keyId,
          applicationKeyUpdated:
            applicationKey !== initialValues.applicationKey,
          endpoint,
          bucket,
        };
      }
      await onSubmit(formData);
    },
    [
      onSubmit,
      initialValues.gmail_appPassword,
      initialValues.mailgun_apiKey,
      initialValues.keyId,
      initialValues.applicationKey,
    ]
  );

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
              label={t('Email delivery service')}
              description={t(
                'Configuration required for sending invoices, notices and all kind of communication to the tenants'
              )}
              withSwitch
              switchName="emailDeliveryServiceActive"
            >
              {values?.emailDeliveryServiceActive ? (
                <>
                  <RadioFieldGroup
                    label={t('Service')}
                    name="emailDeliveryServiceName"
                  >
                    <RadioField value="gmail" label="Gmail" />
                    <RadioField value="mailgun" label="Mailgun" />
                  </RadioFieldGroup>
                  {values?.emailDeliveryServiceName === 'gmail' && (
                    <>
                      <Box my={1}>
                        <Link
                          href={`https://support.google.com/accounts/answer/185833?hl=${store.organization.selected.locale}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('How to use the App password with Gmail')}
                        </Link>
                      </Box>
                      <TextField label={t('Email')} name="gmail_email" />
                      <TextField
                        label={t('Application password')}
                        name="gmail_appPassword"
                        type="password"
                        showHidePassword={
                          values.appPassword !== initialValues.appPassword
                        }
                      />
                    </>
                  )}
                  {values?.emailDeliveryServiceName === 'mailgun' && (
                    <>
                      <Box my={1}>
                        <Link
                          href={`https://help.mailgun.com/hc/${store.organization.selected.locale.toLowerCase()}/articles/203380100-Where-can-I-find-my-API-key-and-SMTP-credentials-`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('How to use the API key and domain with Mailgun')}
                        </Link>
                      </Box>
                      <TextField
                        label={t('Private API key')}
                        name="mailgun_apiKey"
                        type="password"
                        showHidePassword={
                          values.apiKey !== initialValues.apiKey
                        }
                      />
                      <TextField label={t('Domain')} name="mailgun_domain" />
                    </>
                  )}
                  <TextField label={t('From Email')} name="fromEmail" />
                  <TextField label={t('Reply to email')} name="replyToEmail" />
                </>
              ) : null}
            </Section>
            <Section
              label="Backblaze B2 Cloud Storage"
              description={t(
                'Configuration required to store documents in the cloud'
              )}
              withSwitch
              switchName="b2Active"
            >
              {values?.b2Active ? (
                <>
                  <TextField
                    label="KeyId"
                    name="keyId"
                    type="password"
                    showHidePassword={values.keyId !== initialValues.keyId}
                  />
                  <TextField
                    label="ApplicationKey"
                    name="applicationKey"
                    type="password"
                    showHidePassword={
                      values.applicationKey !== initialValues.applicationKey
                    }
                  />
                  <TextField label={t('Bucket')} name="bucket" />
                  <TextField label={t('Bucket endpoint')} name="endpoint" />
                </>
              ) : null}
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

export default ThirdPartiesForm;
