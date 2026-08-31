'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import Loading from '@/components/loading';
import { useRouter } from '@/i18n/navigation';
import apiClient from '@/utils/fetch/client';

const signInFormSchema = Yup.object({
  email: Yup.string().email().required()
});

type SignInFormValues = Yup.InferType<typeof signInFormSchema>;

const defaultValues = {
  email: ''
};

export default function SignIn() {
  const t = useTranslations('common');
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  async function onSubmit(values: SignInFormValues) {
    try {
      setLoading(true);
      const response = await apiClient.post(
        '/api/v2/authenticator/tenant/signin',
        {
          email: values.email
        }
      );
      if (response.status >= 200 && response.status < 300) {
        return router.replace(`/otp/${encodeURIComponent(values.email)}`);
      }
    } catch (error) {
      console.error(error);
    }
    toast.error(t('There was an error while signing in.'));
    setLoading(false);
  }

  return (
    <>
      {loading && <Loading fullScreen />}
      <Formik
        enableReinitialize={true}
        initialValues={defaultValues}
        validationSchema={signInFormSchema}
        onSubmit={onSubmit}
      >
        {() => {
          return (
            <Form className="space-y-10">
              <div className="text-2xl text-center md:text-4xl font-medium text-secondary-foreground">
                {t('Sign in to your account')}
              </div>
              <div className="p-5 md:p-0 md:max-w-sm w-full m-auto space-y-6">
                <TextField
                  label={t('Your email')}
                  name="email"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
                <SubmitButton label={t('Sign in')} className="w-full" />
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
}
