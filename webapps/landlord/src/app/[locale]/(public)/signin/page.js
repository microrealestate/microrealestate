import { setRequestLocale } from 'next-intl/server';
import { isSignUpAvailable } from '@/utils/signup';
import SignInForm from './SignInForm';

export default async function SignIn({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // the link to signup only makes sense while the installation has no owner
  return <SignInForm signUpAvailable={await isSignUpAvailable()} />;
}
