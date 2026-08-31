import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik, validateYupSchema, yupToFormErrors } from 'formik';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import {
  QueryKeys,
  testSmtpConnection,
  updateOrganization
} from '../../utils/restcalls';
import { mergeOrganization, updateStoreOrganization } from './utils';

const DEFAULT_PORTS = { none: 25, starttls: 587, tls: 465 };

const validationSchema = Yup.object().shape({
  smtp_server: Yup.string(),
  smtp_port: Yup.number().when('smtp_server', {
    is: (server) => !!server,
    then: Yup.number().required().integer().min(1).max(65535)
  }),
  smtp_encryption: Yup.string()
    .oneOf(['none', 'starttls', 'tls'])
    .when('smtp_server', {
      is: (server) => !!server,
      then: Yup.string().required()
    }),
  smtp_authentication: Yup.boolean().when('smtp_server', {
    is: (server) => !!server,
    then: Yup.boolean().required()
  }),
  smtp_username: Yup.string().when(['smtp_server', 'smtp_authentication'], {
    is: (server, auth) => !!server && auth,
    then: Yup.string().required()
  }),
  smtp_password: Yup.string().when(['smtp_server', 'smtp_authentication'], {
    is: (server, auth) => !!server && auth,
    then: Yup.string().required()
  }),

  fromEmail: Yup.string()
    .email()
    .when('smtp_server', {
      is: (server) => !!server,
      then: Yup.string().email().required()
    }),
  replyToEmail: Yup.string()
    .email()
    .when('smtp_server', {
      is: (server) => !!server,
      then: Yup.string().email().required()
    })
});

export default function EmailServiceForm({ organization }) {
  const t = useTranslations('common');
  const store = useStore();
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

  const testSmtp = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: () => toast.success(t('SMTP connection successful')),
    onError: () => toast.error(t('SMTP connection failed'))
  });

  const encryptionOptions = useMemo(
    () => [
      {
        id: 'starttls',
        value: 'starttls',
        label: t('STARTTLS (usually port 587)')
      },
      { id: 'tls', value: 'tls', label: t('SSL/TLS (usually port 465)') },
      { id: 'none', value: 'none', label: t('No encryption') }
    ],
    [t]
  );

  const initialValues = useMemo(() => {
    let fromEmail = organization.contacts?.[0]?.email || '';
    let replyToEmail = organization.contacts?.[0]?.email || '';

    if (organization.thirdParties?.smtp?.server) {
      fromEmail = organization.thirdParties?.smtp?.fromEmail || '';
      replyToEmail = organization.thirdParties?.smtp?.replyToEmail || '';
    }

    return {
      smtp_server: organization.thirdParties?.smtp?.server || '',
      smtp_port: organization.thirdParties?.smtp?.port || 587,
      smtp_encryption:
        organization.thirdParties?.smtp?.encryption || 'starttls',
      smtp_authentication:
        organization.thirdParties?.smtp?.authentication === undefined
          ? true
          : organization.thirdParties.smtp.authentication,
      smtp_username: organization.thirdParties?.smtp?.username || '',
      smtp_password: organization.thirdParties?.smtp?.password || '',

      fromEmail,
      replyToEmail
    };
  }, [
    organization.contacts,
    organization.thirdParties?.smtp?.authentication,
    organization.thirdParties?.smtp?.fromEmail,
    organization.thirdParties?.smtp?.password,
    organization.thirdParties?.smtp?.port,
    organization.thirdParties?.smtp?.replyToEmail,
    organization.thirdParties?.smtp?.encryption,
    organization.thirdParties?.smtp?.server,
    organization.thirdParties?.smtp?.username
  ]);

  const onSubmit = useCallback(
    async ({
      smtp_server,
      smtp_port,
      smtp_encryption,
      smtp_authentication,
      smtp_username,
      smtp_password,
      fromEmail,
      replyToEmail
    }) => {
      const formData = { thirdParties: {} };
      if (smtp_server) {
        formData.thirdParties.smtp = {
          server: smtp_server,
          port: smtp_port,
          encryption: smtp_encryption,
          authentication: smtp_authentication,
          username: smtp_username,
          password: smtp_password,
          passwordUpdated: smtp_password !== initialValues.smtp_password,
          fromEmail,
          replyToEmail
        };
      } else {
        formData.thirdParties.smtp = null;
      }
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, formData)
      });
    },
    [mutateAsync, store, organization, initialValues.smtp_password]
  );

  const handleFormValidation = useCallback((value) => {
    try {
      validateYupSchema(value, validationSchema, true, value);
    } catch (err) {
      return yupToFormErrors(err); //for rendering validation errors
    }
    return {};
  }, []);

  return (
    <Formik
      initialValues={initialValues}
      validate={handleFormValidation}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue }) => {
        return (
          <Form autoComplete="off">
            <div className="space-y-4 pb-10">
              <TextField label={t('Server')} name="smtp_server" />
              <NumberField
                label={t('Port')}
                name="smtp_port"
                min="1"
                max="65535"
              />
              <SelectField
                label={t('Encryption')}
                name="smtp_encryption"
                values={encryptionOptions}
                onChange={({ target: { value } }) => {
                  // Never clobber a port the user typed themselves.
                  const port = Number(values.smtp_port);
                  if (!port || [25, 465, 587].includes(port)) {
                    setFieldValue('smtp_port', DEFAULT_PORTS[value]);
                  }
                }}
              />
              <SwitchField
                label={t('Use authentication')}
                name="smtp_authentication"
              />
              {values?.smtp_authentication ? (
                <>
                  <TextField label={t('Username')} name="smtp_username" />
                  <TextField
                    label={t('Password')}
                    name="smtp_password"
                    type="password"
                    showHidePassword={
                      values.smtp_password !== initialValues.smtp_password
                    }
                  />
                </>
              ) : null}
              <TextField label={t('From Email')} name="fromEmail" />
              <TextField label={t('Reply to email')} name="replyToEmail" />
              <Button
                type="button"
                variant="outline"
                disabled={testSmtp.isPending}
                onClick={() =>
                  testSmtp.mutate({
                    organizationId: organization._id,
                    smtp: {
                      server: values.smtp_server,
                      port: values.smtp_port,
                      encryption: values.smtp_encryption,
                      authentication: values.smtp_authentication,
                      username: values.smtp_username,
                      password: values.smtp_password,
                      passwordUpdated:
                        values.smtp_password !== initialValues.smtp_password
                    }
                  })
                }
              >
                {t('Test connection')}
              </Button>
            </div>
            <SubmitButton label={t('Save')} />
          </Form>
        );
      }}
    </Formik>
  );
}
