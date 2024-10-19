import * as Yup from 'yup';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Form, Formik } from 'formik';
import React, { useContext } from 'react';
import { SubmitButton, TextField } from '@microrealestate/commonui/components';
import config from '../config';
import ErrorPage from 'next/error';
import Link from '../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { StoreContext } from '../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: ''
};

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required(),
  lastName: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().required()
});

export default function SignUp() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  if (!config.SIGNUP) {
    return <ErrorPage statusCode={404} />;
  }

  const signUp = async ({ firstName, lastName, email, password }) => {
    try {
      const status = await store.user.signUp(
        firstName,
        lastName,
        email,
        password
      );
      if (status !== 200) {
        switch (status) {
          case 422:
            toast.error(t('Some fields are missing'));
            return;
          case 409:
            toast.error(t('This user is already registered'));
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

  if (store.organization.selected?.name) {
    router.push(`/${store.organization.selected.name}/dashboard`);
    return null;
  }

  return (
    <div className="mt-10 mx-4 sm:container sm:w-[36rem]">
      <div className="flex flex-col items-center mb-10">
        <LocationCityIcon />
        <span className="text-2xl">
          {t('Sign up to {{APP_NAME}}', {
            APP_NAME: config.APP_NAME
          })}
        </span>
        <span className="text-secondary-foreground">{t('for landlords')}</span>
      </div>
      <Card>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={signUp}
        >
          {({ isSubmitting }) => {
            return (
              <Form>
                <CardContent className="pt-6">
                  <TextField label={t('First name')} name="firstName" />
                  <TextField label={t('Last name')} name="lastName" />
                  <TextField label={t('Email Address')} name="email" />
                  <TextField
                    label={t('Password')}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                  />
                </CardContent>
                <CardFooter>
                  <SubmitButton
                    fullWidth
                    label={!isSubmitting ? t('Agree & Join') : t('Joining')}
                  />
                </CardFooter>
              </Form>
            );
          }}
        </Formik>
        <CardFooter>
          <span className="text-secondary-foreground text-center w-full">
            {t('Already on {{APP_NAME}}?', {
              APP_NAME: config.APP_NAME
            })}{' '}
            <Link href="/signin" data-cy="signin">
              {t('Sign in')}
            </Link>
            .
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
