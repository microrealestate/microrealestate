import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useContext } from 'react';
import Link from '../components/Link';
import SignInUpLayout from '../components/SignInUpLayout';
import { StoreContext } from '../store';
import { SubmitButton } from '@microrealestate/commonui/components';
import { TextField } from '../components/formfields/TextField';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../components/Authentication';

const initialValues = {
  currentPassword: '',
  password: '',
  confirmationPassword: ''
};

const validationSchema = Yup.object().shape({
  currentPassword: Yup.string().required(),
  password: Yup.string().required(),
  confirmationPassword: Yup.string()
    .required()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
});

function ChangePassword() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const changePassword = async ({ currentPassword, password }) => {
    try {
      const status = await store.user.changePassword(currentPassword, password);
      if (status !== 200) {
        switch (status) {
          case 422:
            toast.error(t('Some fields are missing'));
            return;
          case 401:
            toast.error(t('Incorrect email or password'));
            return;
          default:
            toast.error(t('Something went wrong'));
            return;
        }
      }

      if (store.organization.items.length) {
        if (!store.organization.selected) {
          store.organization.setSelected(
            store.organization.items[0],
            store.user
          );
        }
        router.push(
          `/${store.organization.selected.name}/dashboard`,
          undefined,
          {
            locale: store.organization.selected.locale
          }
        );
      } else {
        router.push('/firstaccess');
      }
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    }
  };

  return (
    <SignInUpLayout>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={changePassword}
      >
        {({ isSubmitting }) => {
          return (
            <div className="p-5 md:p-0 md:max-w-md w-full">
              <Form className="space-y-10">
                <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
                  {t('Change your password')}
                </div>
                <TextField
                  label={t('Current password')}
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                />
                <TextField
                  label={t('New password')}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                />
                <TextField
                  label={t('Confirmation password')}
                  name="confirmationPassword"
                  type="password"
                  autoComplete="new-password"
                />
                <SubmitButton
                  fullWidth
                  label={!isSubmitting ? t('Change password') : t('Saving')}
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
    </SignInUpLayout>
  );
}
export default withAuthentication(ChangePassword);