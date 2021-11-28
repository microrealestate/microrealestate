import * as Yup from 'yup';

import { Box, Paper, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FormTextField, SubmitButton } from '../components/Form';
import React, { useContext, useEffect, useState } from 'react';

import Link from '../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import Page from '../components/Page';
import RequestError from '../components/RequestError';
import { StoreContext } from '../store';
import getConfig from 'next/config';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { setOrganizationId } from '../utils/fetch';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const {
  publicRuntimeConfig: { DEMO_MODE, SIGNUP, APP_NAME },
} = getConfig();

const defaultValues = {
  email: '',
  password: '',
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required(),
});

const SignIn = observer(() => {
  console.log('Signin functional component');
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [initialValues, setInitialValues] = useState(defaultValues);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (DEMO_MODE) {
      setInitialValues({
        email: 'demo@demo.com',
        password: 'demo',
      });
    }
  }, []);

  const signIn = async ({ email, password }) => {
    try {
      setError('');

      const status = await store.user.signIn(email, password);
      if (status !== 200) {
        switch (status) {
          case 422:
            setError(t('Some fields are missing'));
            return;
          case 401:
            setError(t('Incorrect email or password'));
            return;
          default:
            setError(t('Something went wrong'));
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
        moment.locale(store.organization.selected.locale);
        router.push(`/${store.organization.selected.name}/dashboard`, null, {
          locale: store.organization.selected.locale,
        });
      } else {
        router.push('/firstaccess');
      }
    } catch (error) {
      console.error(error);
      setError(t('Something went wrong'));
    }
  };

  return !store.user.signedIn ? (
    <Page maxWidth="sm">
      <Box mt={10} mb={5}>
        <Box align="center">
          <LocationCityIcon fontSize="large" />
        </Box>
        <Typography component="h1" variant="h5" align="center">
          {t('Sign in to {{APP_NAME}}', { APP_NAME })}
        </Typography>
      </Box>
      <Paper>
        <Box px={4} pb={4} pt={2}>
          <RequestError error={error} />
          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={signIn}
          >
            {({ isSubmitting }) => {
              return (
                <Form>
                  <FormTextField label={t('Email Address')} name="email" />
                  <FormTextField
                    label={t('Password')}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                  />
                  {!DEMO_MODE && (
                    <Typography variant="body2">
                      <Link href="/forgotpassword" data-cy="forgotpassword">
                        {t('Forgot password?')}
                      </Link>
                    </Typography>
                  )}
                  <Box mt={4}>
                    <SubmitButton
                      fullWidth
                      label={!isSubmitting ? t('Sign in') : t('Signing in')}
                      data-cy="submit"
                    />
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </Box>
      </Paper>
      {!DEMO_MODE && SIGNUP && (
        <Box mt={4}>
          <Paper>
            <Box px={4} py={2}>
              <Typography variant="body2">
                {t('New to {{APP_NAME}}?', { APP_NAME })}{' '}
                <Link href="/signup" data-cy="signup">
                  {t('Create an account')}
                </Link>
                .
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Page>
  ) : null;
});

export default SignIn;
