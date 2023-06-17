import * as Yup from 'yup';

import { Box, Paper, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import React, { useContext } from 'react';
import { SubmitButton, TextField } from '@microrealestate/commonui/components';

import config from '../config';
import ErrorPage from 'next/error';
import Link from '../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import Page from '../components/Page';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required(),
  lastName: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().required(),
});

export default function SignUp({ pageError }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  if (pageError) {
    return <ErrorPage statusCode={pageError.statusCode} />;
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
            store.pushToastMessage({
              message: t('Some fields are missing'),
              severity: 'error',
            });
            return;
          case 409:
            store.pushToastMessage({
              message: t('This user is already registered'),
              severity: 'error',
            });
            return;
          default:
            store.pushToastMessage({
              message: t('Something went wrong'),
              severity: 'error',
            });
            return;
        }
      }
      router.push('/signin');
    } catch (error) {
      console.error(error);
      store.pushToastMessage({
        message: t('Something went wrong'),
        severity: 'error',
      });
    }
  };

  if (store.organization.selected?.name) {
    router.push(`/${store.organization.selected.name}/dashboard`);
    return null;
  }

  return (
    <Page maxWidth="sm">
      <Box mt={10} mb={5}>
        <Box align="center">
          <LocationCityIcon fontSize="large" />
        </Box>
        <Typography component="h1" variant="h5" align="center">
          {t('Sign up to {{APP_NAME}}', {
            APP_NAME: config.APP_NAME,
          })}
        </Typography>
      </Box>
      <Paper>
        <Box px={4} pb={4} pt={2}>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={signUp}
          >
            {({ isSubmitting }) => {
              return (
                <Form>
                  <TextField label={t('First name')} name="firstName" />
                  <TextField label={t('Last name')} name="lastName" />
                  <TextField label={t('Email Address')} name="email" />
                  <TextField
                    label={t('Password')}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                  />
                  <Box mt={4}>
                    <SubmitButton
                      fullWidth
                      label={!isSubmitting ? t('Agree & Join') : t('Joining')}
                    />
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </Box>
      </Paper>
      <Box mt={4}>
        <Paper>
          <Box px={4} py={2}>
            <Typography variant="body2">
              {t('Already on {{APP_NAME}}?', {
                APP_NAME: config.APP_NAME,
              })}{' '}
              <Link href="/signin" data-cy="signin">
                {t('Sign in')}
              </Link>
              .
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Page>
  );
}

export async function getServerSideProps() {
  let props = {};
  if (!config.SIGNUP) {
    props = { pageError: { statusCode: 404 } };
  }

  return { props };
}
