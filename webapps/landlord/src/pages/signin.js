import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import config from '../config';
import Link from '../components/Link';
import { setOrganizationId } from '../utils/fetch';
import SignInUpLayout from '../components/SignInUpLayout';
import { StoreContext } from '../store';
import { SubmitButton } from '@microrealestate/commonui/components';
import { TextField } from '../components/formfields/TextField';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const defaultValues = {
  email: '',
  password: ''
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required()
});

export default function SignIn() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [initialValues, setInitialValues] = useState(defaultValues);
  const router = useRouter();

  useEffect(() => {
    if (config.DEMO_MODE) {
      setInitialValues({
        email: 'demo@demo.com',
        password: 'demo'
      });
    }
  }, []);

  const signIn = useCallback(
    async ({ email, password }) => {
      try {
        const status = await store.user.signIn(email, password);
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

        await store.organization.fetch();
        if (store.organization.items.length) {
          if (!store.organization.selected) {
            store.organization.setSelected(
              store.organization.items[0],
              store.user
            );
          }
          setOrganizationId(store.organization.selected._id);
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
    },
    [router, store, t]
  );

  if (store.organization.selected?.name) {
    router.push(`/${store.organization.selected.name}/dashboard`);
    return null;
  }

  return (
    <SignInUpLayout>
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={signIn}
      >
        {({ isSubmitting }) => {
          return (
            <div className="p-5 md:p-0 md:max-w-md w-full">
              <Form className="space-y-10">
                <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
                  {t('Sign in to your account')}
                </div>
                <TextField label={t('Email Address')} name="email" />
                <TextField
                  label={t('Password')}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
                {!config.DEMO_MODE && (
                  <div className="text-right">
                    <Link href="/forgotpassword" data-cy="forgotpassword">
                      {t('Forgot password?')}
                    </Link>
                  </div>
                )}
                <SubmitButton
                  fullWidth
                  label={!isSubmitting ? t('Sign in') : t('Signing in')}
                />
              </Form>
            </div>
          );
        }}
      </Formik>
      {!config.DEMO_MODE && config.SIGNUP && (
        <div className="mt-10 lg:mt-0 lg:absolute lg:bottom-10 text-center text-muted-foreground w-full">
          {t('New to {{APP_NAME}}?', {
            APP_NAME: config.APP_NAME
          })}{' '}
          <Link href="/signup" data-cy="signup">
            {t('Create an account')}
          </Link>
          .
        </div>
      )}
    </SignInUpLayout>
  );
}
