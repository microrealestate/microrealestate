import * as Yup from 'yup';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Form, Formik } from 'formik';
import React, { useContext, useState } from 'react';
import { SubmitButton, TextField } from '@microrealestate/commonui/components';
import { Button } from '../components/ui/button';
import { CheckCircleIcon } from 'lucide-react';
import Link from '../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { StoreContext } from '../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  email: ''
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required()
});

export default function ForgotPassword() {
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
            toast.error(t('Some fields are missing'));
            return;
          default:
            toast.error(t('Something went wrong'));
            return;
        }
      }
      setEmailSent(email);
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    }
  };

  const signIn = (event) => {
    event.preventDefault();
    router.push('/signin');
  };

  if (store.organization.selected?.name) {
    router.push(`/${store.organization.selected.name}/dashboard`);
    return null;
  }

  return (
    <div className="mt-10 mx-4 sm:container sm:w-[36rem]">
      <div className="flex flex-col items-center mb-10">
        <LocationCityIcon />
        <span className="text-2xl">{t('Reset your password')}</span>
      </div>
      <Card>
        {!emailSent ? (
          <>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={forgotPassword}
            >
              {({ isSubmitting }) => {
                return (
                  <Form>
                    <CardContent className="pt-6">
                      <TextField
                        label={t('Email Address')}
                        name="email"
                        autoComplete="email"
                      />
                    </CardContent>
                    <CardFooter>
                      <SubmitButton
                        label={
                          !isSubmitting
                            ? t('Send reset password email')
                            : t('Reseting')
                        }
                        className="w-full"
                      />
                    </CardFooter>
                  </Form>
                );
              }}
            </Formik>
            <CardFooter>
              <span className="text-secondary-foreground text-center w-full">
                <Link href="/signin" data-cy="signin">
                  {t('Sign in')}
                </Link>
                .
              </span>
            </CardFooter>
          </>
        ) : (
          <>
            <CardContent className="flex flex-col  pt-6">
              <div className="flex items-center text-success font-semibold">
                <CheckCircleIcon />
                <span className="ml-2 text-lg my-4">
                  {t('Check your email')}
                </span>
              </div>
              <p>
                {t('An email has been sent to your email address {{email}}', {
                  email: emailSent
                })}
              </p>
              <p>
                {t('Follow the directions in the email to reset your password')}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={signIn} className="w-full">
                {t('Done')}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
