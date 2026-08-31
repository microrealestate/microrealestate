'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuCircleCheck } from 'react-icons/lu';
import { toast } from 'sonner';
import * as Yup from 'yup';
import Link from '@/components/Link';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';

const initialValues = {
  email: ''
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required()
});

export default function ForgotPassword() {
  const t = useTranslations('common');
  const store = useStore();
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

  return !emailSent ? (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={forgotPassword}
      >
        {() => {
          return (
            <Form className="space-y-10 w-full">
              <div className="p-5 md:p-0 md:max-w-sm w-full m-auto space-y-6">
                <div className="pb-5 text-2xl font-medium text-secondary-foreground">
                  {t('Reset your password')}
                </div>
                <TextField
                  label={t('Email Address')}
                  name="email"
                  autoComplete="username"
                  autoFocus
                />
                <SubmitButton label={t('Reset')} className="w-1/2" />
              </div>
            </Form>
          );
        }}
      </Formik>
      <div className="absolute mt-0 bottom-10 flex flex-col items-center w-full">
        {t('Do you already have an account?')}
        <Link href="/signin" data-cy="signin">
          {t('Sign in')}
        </Link>
      </div>
    </>
  ) : (
    <div className="p-5 lg:text-left md:p-0 md:max-w-md w-full space-y-10">
      <div className="flex items-center text-success font-semibold">
        <LuCircleCheck />
        <span className="ml-2 text-lg my-4">{t('Check your email')}</span>
      </div>
      <div>
        <p>
          {t('An email has been sent to your email address {email}', {
            email: emailSent
          })}
        </p>
        <p>{t('Follow the directions in the email to reset your password')}</p>
      </div>
      <Button onClick={signIn} className="w-1/2">
        {t('Done')}
      </Button>
    </div>
  );
}
