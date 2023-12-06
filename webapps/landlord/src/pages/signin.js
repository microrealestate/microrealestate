import * as Yup from 'yup';

import { Box, Paper, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SubmitButton, TextField } from '@microrealestate/commonui/components';

import config from '../config';
import Link from '../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import Page from '../components/Page';
import { setOrganizationId } from '../utils/fetch';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const defaultValues = {
  email: '',
  password: '',
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required(),
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
        password: 'demo',
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
              store.pushToastMessage({
                message: t('Some fields are missing'),
                severity: 'error',
              });
              return;
            case 401:
              store.pushToastMessage({
                message: t('Incorrect email or password'),
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
              locale: store.organization.selected.locale,
            }
          );
        } else {
          router.push('/firstaccess');
        }
      } catch (error) {
        console.error(error);
        store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
    },
    [router, store, t]
  );

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
        <Typography component="h1" variant="h4" align="center">
          {config.APP_NAME}
        </Typography>
        <Box align="center">{t('for landlords')}</Box>
      </Box>
      <Paper>
        <Box px={4} pb={4} pt={2}>
          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={signIn}
          >
            {({ isSubmitting }) => {
              return (
                <Form>
                  <TextField label={t('Email Address')} name="email" />
                  <TextField
                    label={t('Password')}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                  />
                  {!config.DEMO_MODE && (
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
                    />
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </Box>
      </Paper>
      {!config.DEMO_MODE && config.SIGNUP && (
        <Box mt={4}>
          <Paper>
            <Box px={4} py={2}>
              <Typography variant="body2">
                {t('New to {{APP_NAME}}?', {
                  APP_NAME: config.APP_NAME,
                })}{' '}
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
  );
}
