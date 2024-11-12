import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useContext, useState } from 'react';
import { Button } from '../components/ui/button';
import Link from '../components/Link';
import { LuCheckCircle } from 'react-icons/lu';
import SignInUpLayout from '../components/SignInUpLayout';
import { StoreContext } from '../store';
import { SubmitButton } from '@microrealestate/commonui/components';
import { TextField } from '../components/formfields/TextField';
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
    <SignInUpLayout>
      {!emailSent ? (
        <>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={forgotPassword}
          >
            {({ isSubmitting }) => {
              return (
                <div className="p-5 md:p-0 md:max-w-md w-full">
                  <Form className="space-y-10">
                    <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
                      {t('Reset your password')}
                    </div>
                    <TextField
                      label={t('Email Address')}
                      name="email"
                      autoComplete="email"
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
      ) : (
        <div className="p-5 text-center lg:text-left md:p-0 md:max-w-md w-full space-y-10">
          <div className="flex items-center justify-center lg:justify-normal text-success font-semibold">
            <LuCheckCircle />
            <span className="ml-2 text-lg my-4">{t('Check your email')}</span>
          </div>
          <div>
            <p>
              {t('An email has been sent to your email address {{email}}', {
                email: emailSent
              })}
            </p>
            <p>
              {t('Follow the directions in the email to reset your password')}
            </p>
          </div>
          <Button onClick={signIn} className="w-full">
            {t('Done')}
          </Button>
        </div>
      )}
    </SignInUpLayout>
  );
}
