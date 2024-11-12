import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useContext } from 'react';
import Link from '../../components/Link';
import SignInUpLayout from '../../components/SignInUpLayout';
import { StoreContext } from '../../store';
import { SubmitButton } from '@microrealestate/commonui/components';
import { TextField } from '../../components/formfields/TextField';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  password: '',
  confirmationPassword: ''
};

const validationSchema = Yup.object().shape({
  password: Yup.string().required(),
  confirmationPassword: Yup.string()
    .required()
    .oneOf([Yup.ref('password'), null], 'Passwords must match') // TODO translate this
});

export default function ResetPassword() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const { resetToken } = router.query;

  const resetPassword = async ({ password }) => {
    try {
      const status = await store.user.resetPassword(resetToken, password);
      if (status !== 200) {
        switch (status) {
          case 422:
            toast.error(t('Some fields are missing'));
            return;
          case 403:
            toast.error(t('Invalid reset link'));
            return;
          default:
            toast.error(t('Something went wrong'));
            return;
        }
      }
      router.push('/signin');
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    }
  };

  return (
    <SignInUpLayout>
      <>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={resetPassword}
        >
          {({ isSubmitting }) => {
            return (
              <div className="p-5 md:p-0 md:max-w-md w-full">
                <Form className="space-y-10">
                  <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
                    {t('Reset your password')}
                  </div>
                  <TextField
                    label={t('New password')}
                    name="password"
                    type="password"
                  />
                  <TextField
                    label={t('Confirmation password')}
                    name="confirmationPassword"
                    type="password"
                  />

                  <SubmitButton
                    label={!isSubmitting ? t('Reset') : t('Reseting')}
                    className="w-full"
                  />
                </Form>
              </div>
            );
          }}
        </Formik>

        <div className="mt-10 lg:mt-0 lg:absolute lg:bottom-10 text-center text-muted-foreground w-full">
          <Link href="/signin" data-cy="signin">
            {t('Sign in')}
          </Link>
          .
        </div>
      </>
    </SignInUpLayout>
  );
}
