import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useContext, useMemo } from 'react';
import config from '../config';
import ErrorPage from 'next/error';
import Link from '../components/Link';
import SignInUpLayout from '../components/SignInUpLayout';
import { StoreContext } from '../store';
import { SubmitButton } from '@microrealestate/commonui/components';
import { TextField } from '../components/formfields/TextField';
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
  const invitedEmail = useMemo(
    () => String(router.query?.email || '').trim().toLowerCase(),
    [router.query?.email]
  );
  const isCollaboratorInvite = router.query?.invite === 'collaborator';

  if (!config.SIGNUP) {
    return <ErrorPage statusCode={404} />;
  }

  const signUp = async ({ firstName, lastName, email, password }) => {
    const effectiveEmail = invitedEmail || String(email || '').trim().toLowerCase();
    try {
      const status = await store.user.signUp(
        firstName,
        lastName,
        effectiveEmail,
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
      const signInQuery =
        effectiveEmail && isCollaboratorInvite
          ? `?email=${encodeURIComponent(effectiveEmail)}&invite=collaborator`
          : effectiveEmail
            ? `?email=${encodeURIComponent(effectiveEmail)}`
            : '';
      router.push(`/signin${signInQuery}`);
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
    <SignInUpLayout>
      <Formik
        initialValues={{
          ...initialValues,
          email: invitedEmail || initialValues.email
        }}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={signUp}
      >
        {({ isSubmitting }) => {
          return (
            <div className="p-5 md:p-0 md:max-w-md w-full">
              <Form className="space-y-10">
                <div className="text-2xl text-center md:text-left md:text-4xl font-medium text-secondary-foreground">
                  {isCollaboratorInvite
                    ? t('Sign up to join your organization')
                    : t('Sign up and manage your properties online')}
                </div>
                {isCollaboratorInvite && invitedEmail ? (
                  <div className="text-sm text-muted-foreground">
                    {t('You are signing up as a collaborator for {{email}}.', {
                      email: invitedEmail
                    })}
                  </div>
                ) : null}
                <TextField label={t('First name')} name="firstName" />
                <TextField label={t('Last name')} name="lastName" />
                <TextField
                  label={t('Email Address')}
                  name="email"
                  disabled={!!invitedEmail}
                />
                <TextField
                  label={t('Password')}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
                <SubmitButton
                  fullWidth
                  label={!isSubmitting ? t('Agree & Join') : t('Joining')}
                />
              </Form>
            </div>
          );
        }}
      </Formik>
      <div className="mt-10 lg:mt-0 lg:absolute lg:bottom-10 text-center text-muted-foreground w-full">
        {t('Already on {{APP_NAME}}?', {
          APP_NAME: config.APP_NAME
        })}{' '}
        <Link href="/signin" data-cy="signin">
          {t('Sign in')}
        </Link>
        .
      </div>
    </SignInUpLayout>
  );
}
