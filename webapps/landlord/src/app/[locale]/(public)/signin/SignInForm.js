'use client';

import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as Yup from 'yup';
import Link from '@/components/Link';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';
import { BASE_PATH } from '@/utils/basepath';
import { sanitizeRedirect } from '@/utils/redirect';

const defaultValues = {
  email: '',
  password: ''
};

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required()
});

export default function SignInForm({ signUpAvailable }) {
  const t = useTranslations('common');
  const store = useStore();
  const { redirectTo } = useNav();
  const searchParams = useSearchParams();
  const safeRedirect = sanitizeRedirect(searchParams.get('redirectTo'));

  const signIn = async ({ email, password }) => {
    try {
      const status = await store.user.signIn(email, password);
      if (status !== 200) {
        switch (status) {
          case 422:
            toast.error(t('Some fields are missing'));
            return;
          case 401:
            toast.error(t('Incorrect email or password'));
            return;
          default:
            toast.error(t('Something went wrong'));
            return;
        }
      }
      redirectTo(safeRedirect || BASE_PATH);
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    }
  };

  return (
    <>
      <Formik
        enableReinitialize={true}
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={signIn}
      >
        {() => {
          return (
            <Form className="space-y-10 w-full">
              <div className="p-5 w-full m-auto space-y-6 md:p-0 md:max-w-sm">
                <div className="pb-5 text-2xl font-medium text-secondary-foreground">
                  {t('Sign in to your account')}
                </div>
                <TextField
                  id="email"
                  label={t('Email Address')}
                  name="email"
                  autoComplete="username"
                  autoFocus
                />
                <TextField
                  id="password"
                  label={t('Password')}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
                <div className="text-right">
                  <Link href="/forgotpassword" data-cy="forgotpassword">
                    {t('Forgot password?')}
                  </Link>
                </div>
                <SubmitButton label={t('Sign in')} className="w-1/2" />
              </div>
            </Form>
          );
        }}
      </Formik>
      {signUpAvailable && (
        <div className="absolute mt-0 bottom-10 flex flex-col items-center w-full">
          {t("Haven't created an account yet?")}
          <Link href="/signup" data-cy="signup">
            {t('Create an account')}
          </Link>
        </div>
      )}
    </>
  );
}
