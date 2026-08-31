import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { isSignUpAvailable } from '@/utils/signup';
import SignUpForm from './SignUpForm';

export default async function SignUp({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await isSignUpAvailable())) {
    redirect({ href: '/signin', locale });
  }

  return <SignUpForm />;
}
