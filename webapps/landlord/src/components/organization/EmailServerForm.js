import * as Yup from 'yup';
import { Form, Formik, validateYupSchema, yupToFormErrors } from 'formik';
import { mergeOrganization, updateStoreOrganization } from './utils';
import {
  NumberField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import {
  QueryKeys,
  sendEmailServerTest,
  updateOrganization
} from '../../utils/restcalls';
import { useCallback, useContext, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import Link from '../Link';
import { Section } from '../formfields/Section';
import { StoreContext } from '../../store';
import { SwitchField } from '../formfields/SwitchField';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  emailDeliveryServiceActive: Yup.boolean().required(),
  emailDeliveryServiceName: Yup.string().when('emailDeliveryServiceActive', {
    is: true,
    then: Yup.string().required()
  }),

  gmail_email: Yup.string().when('emailDeliveryServiceName', {
    is: 'gmail',
    then: Yup.string().email().required()
  }),
  gmail_appPassword: Yup.string().when('emailDeliveryServiceName', {
    is: 'gmail',
    then: Yup.string().required()
  }),

  graph_tenantId: Yup.string().when('emailDeliveryServiceName', {
    is: 'graph',
    then: Yup.string().required()
  }),
  graph_clientId: Yup.string().when('emailDeliveryServiceName', {
    is: 'graph',
    then: Yup.string().required()
  }),
  graph_clientSecret: Yup.string().when('emailDeliveryServiceName', {
    is: 'graph',
    then: Yup.string().required()
  }),
  graph_senderEmail: Yup.string().when('emailDeliveryServiceName', {
    is: 'graph',
    then: Yup.string().email().required()
  }),

  smtp_server: Yup.string().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.string().required()
  }),
  smtp_port: Yup.string().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.number().required().integer().min(1).max(65535)
  }),
  smtp_secure: Yup.string().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.boolean().required()
  }),
  smtp_authentication: Yup.string().when('emailDeliveryServiceName', {
    is: 'smtp',
    then: Yup.boolean().required()
  }),
  smtp_username: Yup.string().when(
    ['emailDeliveryServiceName', 'smtp_authentication'],
    {
      is: (scheme, auth) => scheme === 'smtp' && auth,
      then: Yup.string().required()
    }
  ),
  smtp_password: Yup.string().when(
    ['emailDeliveryServiceName', 'smtp_authentication'],
    {
      is: (scheme, auth) => scheme === 'smtp' && auth,
      then: Yup.string().required()
    }
  ),

  mailgun_apiKey: Yup.string().when('emailDeliveryServiceName', {
    is: 'mailgun',
    then: Yup.string().required()
  }),
  mailgun_domain: Yup.string().when('emailDeliveryServiceName', {
    is: 'mailgun',
    then: Yup.string().required()
  })
});

function EmailServerForm({ organization }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: updateOrganization
  });

  const { mutateAsync: sendTestEmailMutateAsync, isPending: isSendingTestEmail } =
    useMutation({
      mutationFn: sendEmailServerTest,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.ORGANIZATIONS]
        });
      }
    });

  const initialValues = useMemo(() => {
    let emailDeliveryServiceName = 'gmail';
    let fromEmail = '';
    let replyToEmail = '';

    if (organization.thirdParties?.gmail?.selected) {
      emailDeliveryServiceName = 'gmail';
      fromEmail = organization.thirdParties?.gmail?.fromEmail || '';
      replyToEmail = organization.thirdParties?.gmail?.replyToEmail || '';
    } else if (organization.thirdParties?.graph?.selected) {
      emailDeliveryServiceName = 'graph';
      fromEmail = organization.thirdParties?.graph?.fromEmail || '';
      replyToEmail = organization.thirdParties?.graph?.replyToEmail || '';
    } else if (organization.thirdParties?.smtp?.selected) {
      emailDeliveryServiceName = 'smtp';
      fromEmail = organization.thirdParties?.smtp?.fromEmail || '';
      replyToEmail = organization.thirdParties?.smtp?.replyToEmail || '';
    } else if (organization.thirdParties?.mailgun?.selected) {
      emailDeliveryServiceName = 'mailgun';
      fromEmail = organization.thirdParties?.mailgun?.fromEmail || '';
      replyToEmail = organization.thirdParties?.mailgun?.replyToEmail || '';
    }

    return {
      emailDeliveryServiceActive:
        !!organization.thirdParties?.gmail?.selected ||
        !!organization.thirdParties?.graph?.selected ||
        !!organization.thirdParties?.smtp?.selected ||
        !!organization.thirdParties?.mailgun?.selected,
      emailDeliveryServiceName,
      gmail_email: organization.thirdParties?.gmail?.email || '',
      gmail_appPassword: organization.thirdParties?.gmail?.appPassword || '',

      graph_tenantId: organization.thirdParties?.graph?.tenantId || '',
      graph_clientId: organization.thirdParties?.graph?.clientId || '',
      graph_clientSecret: organization.thirdParties?.graph?.clientSecret || '',
      graph_senderEmail: organization.thirdParties?.graph?.senderEmail || '',

      smtp_server: organization.thirdParties?.smtp?.server || '',
      smtp_port: organization.thirdParties?.smtp?.port || 25,
      smtp_secure: !!organization.thirdParties?.smtp?.secure,
      smtp_authentication:
        organization.thirdParties?.smtp?.authentication === undefined
          ? true
          : organization.thirdParties.smtp.authentication,
      smtp_username: organization.thirdParties?.smtp?.username || '',
      smtp_password: organization.thirdParties?.smtp?.password || '',

      mailgun_apiKey: organization.thirdParties?.mailgun?.apiKey || '',
      mailgun_domain: organization.thirdParties?.mailgun?.domain || '',

      fromEmail,
      replyToEmail,
      testEmailRecipient: ''
    };
  }, [organization.thirdParties]);

  const onSubmit = useCallback(
    async ({
      emailDeliveryServiceActive,
      emailDeliveryServiceName,
      gmail_email,
      gmail_appPassword,
      graph_tenantId,
      graph_clientId,
      graph_clientSecret,
      graph_senderEmail,
      smtp_server,
      smtp_port,
      smtp_secure,
      smtp_authentication,
      smtp_username,
      smtp_password,
      mailgun_apiKey,
      mailgun_domain,
      fromEmail,
      replyToEmail
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
          replyToEmail
        };

        formData.thirdParties.graph = {
          selected: emailDeliveryServiceName === 'graph',
          tenantId: graph_tenantId,
          clientId: graph_clientId,
          clientSecret: graph_clientSecret,
          clientSecretUpdated:
            graph_clientSecret !== initialValues.graph_clientSecret,
          senderEmail: graph_senderEmail,
          fromEmail,
          replyToEmail
        };

        formData.thirdParties.smtp = {
          selected: emailDeliveryServiceName === 'smtp',
          server: smtp_server,
          port: smtp_port,
          secure: smtp_secure,
          authentication: smtp_authentication,
          username: smtp_username,
          password: smtp_password,
          passwordUpdated: smtp_password !== initialValues.smtp_password,
          fromEmail,
          replyToEmail
        };

        formData.thirdParties.mailgun = {
          selected: emailDeliveryServiceName === 'mailgun',
          apiKey: mailgun_apiKey,
          apiKeyUpdated: mailgun_apiKey !== initialValues.mailgun_apiKey,
          domain: mailgun_domain,
          fromEmail,
          replyToEmail
        };
      } else {
        formData.thirdParties.gmail = null;
        formData.thirdParties.graph = null;
        formData.thirdParties.smtp = null;
        formData.thirdParties.mailgun = null;
      }
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, formData)
      });
    },
    [
      mutateAsync,
      store,
      organization,
      initialValues.gmail_appPassword,
      initialValues.graph_clientSecret,
      initialValues.smtp_password,
      initialValues.mailgun_apiKey
    ]
  );

  const handleFormValidation = useCallback((value) => {
    try {
      validateYupSchema(value, validationSchema, true, value);
    } catch (err) {
      console.error(err);
      return yupToFormErrors(err);
    }
    return {};
  }, []);

  const onSendTestEmail = useCallback(
    async (organizationId, recipientEmail) => {
      const email = String(recipientEmail || '').trim().toLowerCase();
      if (!email) {
        toast.error(t('Please enter a recipient email'));
        return;
      }
      try {
        await sendTestEmailMutateAsync({ organizationId, email });
        toast.success(t('Test email sent'));
      } catch (error) {
        const status = error?.response?.status;
        if (status === 422) {
          toast.error(t('Please configure and save the email server first'));
          return;
        }
        toast.error(t('Error sending test email'));
      }
    },
    [sendTestEmailMutateAsync, t]
  );

  return (
    <Formik
      initialValues={initialValues}
      validate={handleFormValidation}
      onSubmit={onSubmit}
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
                    <RadioField value="graph" label="Microsoft Graph" />
                    <RadioField value="smtp" label="SMTP" />
                    <RadioField value="mailgun" label="Mailgun" />
                  </RadioFieldGroup>
                  {values?.emailDeliveryServiceName === 'gmail' && (
                    <>
                      <Link
                        href={`https://support.google.com/accounts/answer/185833?hl=${organization.locale}`}
                        target="_blank"
                        rel="noreferrer"
                        className="my-2"
                      >
                        {t('How to use the App password with Gmail')}
                      </Link>
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
                  {values?.emailDeliveryServiceName === 'graph' && (
                    <>
                      <TextField label={t('Tenant ID')} name="graph_tenantId" />
                      <TextField label={t('Client ID')} name="graph_clientId" />
                      <TextField
                        label={t('Client secret')}
                        name="graph_clientSecret"
                        type="password"
                        showHidePassword={
                          values.graph_clientSecret !==
                          initialValues.graph_clientSecret
                        }
                      />
                      <TextField
                        label={t('Sender mailbox email')}
                        name="graph_senderEmail"
                      />
                    </>
                  )}
                  {values?.emailDeliveryServiceName === 'smtp' && (
                    <>
                      <TextField label={t('Server')} name="smtp_server" />
                      <NumberField
                        label={t('Port')}
                        name="smtp_port"
                        min="1"
                        max="65535"
                      />
                      <SwitchField
                        label={t(
                          'Enable explicit TLS (Implicit TLS / StartTLS is always used when supported by the SMTP)'
                        )}
                        name="smtp_secure"
                      />
                      <br />
                      <SwitchField
                        label={t('Use authentication')}
                        name="smtp_authentication"
                      />
                      {values?.smtp_authentication ? (
                        <>
                          <TextField
                            label={t('Username')}
                            name="smtp_username"
                          />
                          <TextField
                            label={t('Password')}
                            name="smtp_password"
                            type="password"
                            showHidePassword={
                              values.password !== initialValues.password
                            }
                          />
                        </>
                      ) : null}
                    </>
                  )}
                  {values?.emailDeliveryServiceName === 'mailgun' && (
                    <>
                      <Link
                        href={`https://help.mailgun.com/hc/${organization.locale.toLowerCase()}/articles/203380100-Where-can-I-find-my-API-key-and-SMTP-credentials-`}
                        target="_blank"
                        rel="noreferrer"
                        className="my-2"
                      >
                        {t('How to use the API key and domain with Mailgun')}
                      </Link>
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
                  <div className="pt-2 space-y-2">
                    <TextField
                      label={t('Test email recipient')}
                      name="testEmailRecipient"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onSendTestEmail(
                          organization?._id,
                          values.testEmailRecipient
                        )
                      }
                      disabled={isSendingTestEmail}
                    >
                      {isSendingTestEmail
                        ? t('Sending test email...')
                        : t('Send test email')}
                    </Button>
                  </div>
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
}

export default EmailServerForm;
