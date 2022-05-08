import * as Yup from 'yup';

import { Box, Button, Grid, Paper, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FormTextField, SubmitButton } from '../components/Form';
import React, { useContext, useState } from 'react';

import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { observer } from 'mobx-react-lite';
import Page from '../components/Page';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  email: '',
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
});

const ForgotPassword = observer(() => {
  console.log('ForgotPassword functional component');
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [emailSent, setEmailSent] = useState('');
  const router = useRouter();

  const forgotPassword = async ({ email }) => {
    try {
      const status = await store.user.forgotPassword(email);
      if (status !== 200) {
        switch (status) {
          case 422:
            store.pushToastMessage({
              message: t('Some fields are missing'),
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
      setEmailSent(email);
    } catch (error) {
      console.error(error);
      store.pushToastMessage({
        message: t('Something went wrong'),
        severity: 'error',
      });
    }
  };

  const signIn = (event) => {
    event.preventDefault();
    router.push('/signin');
  };

  return (
    <Page maxWidth="sm">
      <Box mt={10} mb={5}>
        <Box align="center">
          <LocationCityIcon fontSize="large" />
        </Box>
        <Typography component="h1" variant="h5" align="center">
          {t('Reset your password')}
        </Typography>
      </Box>
      <Paper>
        {!emailSent && (
          <Box px={4} pb={4} pt={2}>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={forgotPassword}
            >
              {({ isSubmitting }) => {
                return (
                  <Form>
                    <FormTextField
                      label={t('Email Address')}
                      name="email"
                      autoComplete="email"
                    />
                    <Box pt={2}>
                      <Grid container spacing={2}>
                        <Grid item>
                          <Button variant="contained" onClick={signIn}>
                            {t('Cancel')}
                          </Button>
                        </Grid>
                        <Grid item>
                          <SubmitButton
                            label={
                              !isSubmitting
                                ? t('Send reset password email')
                                : t('Reseting')
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Form>
                );
              }}
            </Formik>
          </Box>
        )}
        {emailSent && (
          <Box px={4} pb={4} pt={2}>
            <Box color="success.main" align="center">
              <CheckCircleOutlineIcon fontSize="large" />
            </Box>
            <Box pb={1}>
              <Typography componnent="h2" variant="h6" align="center">
                {t('Check your email')}
              </Typography>
            </Box>
            <Typography variant="body2" align="center">
              {t('An email has been sent to your email address {{email}}', {
                email: emailSent,
              })}
            </Typography>
            <Typography variant="body2" align="center">
              {t('Follow the directions in the email to reset your password')}
            </Typography>
            <Box align="center" pt={2}>
              <Button color="primary" variant="contained" onClick={signIn}>
                {t('Done')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Page>
  );
});

export default ForgotPassword;
