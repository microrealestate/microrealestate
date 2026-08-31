'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as Yup from 'yup';
import Link from '@/components/Link';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { PASSWORD_HELP, passwordSchema } from '@/utils/passwordschema';

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
  password: passwordSchema
});

export default function SignUpForm() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();

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
          case 403:
            toast.error(t('Signup is closed'));
            return;
          case 400:
            toast.error(
              t('The password does not meet the security requirements')
            );
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

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={signUp}
      >
        {() => {
          return (
            <Form className="space-y-10 w-full">
              <div className="p-5 md:p-0 md:max-w-sm w-full m-auto space-y-6">
                <div className="pb-5 text-2xl font-medium text-secondary-foreground">
                  {t('Create your account and start managing your properties')}
                </div>
                <TextField
                  label={t('First name')}
                  name="firstName"
                  autoComplete="given-name"
                  autoFocus
                />
                <TextField
                  label={t('Last name')}
                  name="lastName"
                  autoComplete="family-name"
                />
                <TextField
                  id="email"
                  label={t('Email Address')}
                  name="email"
                  autoComplete="username"
                />
                <TextField
                  id="password"
                  label={t('Password')}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  description={t(PASSWORD_HELP)}
                />
                <SubmitButton
                  label={t('Create an account')}
                  className="w-1/2"
                />
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
  );
}
