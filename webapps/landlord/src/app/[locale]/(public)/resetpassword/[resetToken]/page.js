'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { Link, useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import {
  confirmationPasswordSchema,
  PASSWORD_HELP,
  passwordSchema
} from '@/utils/passwordschema';

const initialValues = {
  password: '',
  confirmationPassword: ''
};

const validationSchema = Yup.object().shape({
  password: passwordSchema,
  confirmationPassword: confirmationPasswordSchema()
});

export default function ResetPassword({ params }) {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();

  const { resetToken } = use(params);

  const resetPassword = async ({ password }) => {
    try {
      const status = await store.user.resetPassword(resetToken, password);
      if (status !== 200) {
        switch (status) {
          case 422:
            toast.error(t('Some fields are missing'));
            return;
          case 400:
            toast.error(
              t('The password does not meet the security requirements')
            );
            return;
          case 403:
            toast.error(t('Invalid reset link'));
            return;
          default:
            toast.error(t('Something went wrong'));
            return;
        }
      }
      toast.success(t('Password reset successfully'));
      router.push('/signin');
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    }
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={resetPassword}
      >
        {() => {
          return (
            <Form className="space-y-10 w-full">
              <div className="p-5 md:p-0 md:max-w-sm w-full m-auto space-y-6">
                <div className="text-2xl font-medium text-secondary-foreground">
                  {t('Reset your password')}
                </div>
                <TextField
                  id="password"
                  label={t('New password')}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  description={t(PASSWORD_HELP)}
                  autoFocus
                />
                <TextField
                  id="confirmationPassword"
                  label={t('Confirmation password')}
                  name="confirmationPassword"
                  type="password"
                  autoComplete="new-password"
                />

                <SubmitButton label={t('Reset')} className="w-1/2" />
              </div>
            </Form>
          );
        }}
      </Formik>
      <div className="absolute mt-0 bottom-10 flex flex-col items-center w-full">
        {t('Do you already have an account?')}
        <Link href="/signin" data-cy="signin">
          {t('Sign in')}
        </Link>
      </div>
    </>
  );
}
