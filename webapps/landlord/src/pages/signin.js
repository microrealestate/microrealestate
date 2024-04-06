import * as Yup from 'yup';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SubmitButton, TextField } from '@microrealestate/commonui/components';
import config from '../config';
import Link from '../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { setOrganizationId } from '../utils/fetch';
import { StoreContext } from '../store';
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
    <div className="mt-10 mx-4 sm:container sm:w-[36rem]">
      <div className="flex flex-col items-center mb-10">
        <LocationCityIcon />
        <span className="text-2xl">{config.APP_NAME}</span>
        <span className="text-secondary-foreground">{t('for landlords')}</span>
      </div>
      <Card>
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={signIn}
        >
          {({ isSubmitting }) => {
            return (
              <Form>
                <CardContent className="pt-6">
                  <TextField label={t('Email Address')} name="email" />
                  <TextField
                    label={t('Password')}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                  />
                  {!config.DEMO_MODE && (
                    <Link href="/forgotpassword" data-cy="forgotpassword">
                      {t('Forgot password?')}
                    </Link>
                  )}
                </CardContent>
                <CardFooter>
                  <SubmitButton
                    fullWidth
                    label={!isSubmitting ? t('Sign in') : t('Signing in')}
                  />
                </CardFooter>
              </Form>
            );
          }}
        </Formik>
        {!config.DEMO_MODE && config.SIGNUP && (
          <CardFooter>
            <span className="text-secondary-foreground text-center w-full">
              {t('New to {{APP_NAME}}?', {
                APP_NAME: config.APP_NAME
              })}{' '}
              <Link href="/signup" data-cy="signup">
                {t('Create an account')}
              </Link>
              .
            </span>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
