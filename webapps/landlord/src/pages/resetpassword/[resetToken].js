import * as Yup from 'yup';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Form, Formik } from 'formik';
import React, { useContext } from 'react';
import { SubmitButton, TextField } from '@microrealestate/commonui/components';
import Link from '../../components/Link';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  password: '',
  confirmationPassword: ''
};

const validationSchema = Yup.object().shape({
  password: Yup.string().required(),
  confirmationPassword: Yup.string()
    .required()
    .oneOf([Yup.ref('password'), null], 'Passwords must match') // TODO translate this
});

export default function ResetPassword() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const { resetToken } = router.query;

  const resetPassword = async ({ password }) => {
    try {
      const status = await store.user.resetPassword(resetToken, password);
      if (status !== 200) {
        switch (status) {
          case 422:
            toast.error(t('Some fields are missing'));
            return;
          case 403:
            toast.error(t('Invalid reset link'));
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
    <div className="mt-10 mx-4 sm:container sm:w-[36rem]">
      <div className="flex flex-col items-center mb-10">
        <LocationCityIcon />
        <span className="text-2xl">{t('Reset your password')}</span>
      </div>
      <Card>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={resetPassword}
        >
          {({ isSubmitting }) => {
            return (
              <Form>
                <CardContent className="pt-6">
                  <TextField
                    label={t('New password')}
                    name="password"
                    type="password"
                  />
                  <TextField
                    label={t('Confirmation password')}
                    name="confirmationPassword"
                    type="password"
                  />
                </CardContent>
                <CardFooter>
                  <SubmitButton
                    label={
                      !isSubmitting ? t('Reset my password') : t('Reseting')
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
      </Card>
    </div>
  );
}
