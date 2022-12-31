import * as Yup from 'yup';

import { Form, Formik } from 'formik';
import {
  Section,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { useCallback, useContext, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  mailgunActive: Yup.boolean().required(),
  apiKey: Yup.string().when(['mailgunActive'], {
    is: (mailgunActive) => mailgunActive,
    then: Yup.string().required(),
  }),
  domain: Yup.string().when(['mailgunActive'], {
    is: (mailgunActive) => mailgunActive,
    then: Yup.string().required(),
  }),
  fromEmail: Yup.string()
    .email()
    .when(['mailgunActive'], {
      is: (mailgunActive) => mailgunActive,
      then: Yup.string().email().required(),
    }),
  replyToEmail: Yup.string()
    .email()
    .when(['mailgunActive'], {
      is: (mailgunActive) => mailgunActive,
      then: Yup.string().email().required(),
    }),
  b2Active: Yup.boolean().required(),
  keyId: Yup.string().when(['b2Active'], {
    is: (b2Active) => b2Active,
    then: Yup.string().required(),
  }),
  applicationKey: Yup.string().when(['b2Active'], {
    is: (b2Active) => b2Active,
    then: Yup.string().required(),
  }),
  endpoint: Yup.string().when(['b2Active'], {
    is: (b2Active) => b2Active,
    then: Yup.string().required(),
  }),
  bucket: Yup.string().when(['b2Active'], {
    is: (b2Active) => b2Active,
    then: Yup.string().required(),
  }),
});

const ThirdPartiesForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      mailgunActive:
        !!store.organization.selected.thirdParties?.mailgun?.apiKey,
      apiKey: store.organization.selected.thirdParties?.mailgun?.apiKey || '',
      domain: store.organization.selected.thirdParties?.mailgun?.domain || '',
      fromEmail:
        store.organization.selected.thirdParties?.mailgun?.fromEmail ||
        store.organization.selected?.contacts?.[0]?.email ||
        '',
      replyToEmail:
        store.organization.selected.thirdParties?.mailgun?.replyToEmail ||
        store.organization.selected?.contacts?.[0]?.email ||
        '',
      b2Active: !!store.organization.selected.thirdParties?.b2?.keyId,
      keyId: store.organization.selected.thirdParties?.b2?.keyId,
      applicationKey:
        store.organization.selected.thirdParties?.b2?.applicationKey,
      endpoint: store.organization.selected.thirdParties?.b2?.endpoint,
      bucket: store.organization.selected.thirdParties?.b2?.bucket,
    }),
    [store.organization.selected]
  );

  const _onSubmit = useCallback(
    async ({
      mailgunActive,
      apiKey,
      domain,
      fromEmail,
      replyToEmail,
      b2Active,
      keyId,
      applicationKey,
      endpoint,
      bucket,
    }) => {
      const formData = { thirdParties: {} };
      if (mailgunActive) {
        formData.thirdParties.mailgun = {
          apiKey,
          apiKeyUpdated: apiKey !== initialValues.apiKey,
          domain,
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
      initialValues.apiKey,
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
              label="Mailgun"
              description={t(
                'Configuration required for sending invoices, notices and all kind of communication to the tenants'
              )}
              withSwitch
              switchName="mailgunActive"
            >
              {values?.mailgunActive ? (
                <>
                  <TextField
                    label={t('Private API key')}
                    name="apiKey"
                    type="password"
                    showHidePassword={values.apiKey !== initialValues.apiKey}
                  />
                  <TextField label={t('Domain')} name="domain" />
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
