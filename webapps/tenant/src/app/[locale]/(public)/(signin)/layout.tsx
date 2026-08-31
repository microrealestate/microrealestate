import PublicLayout from '@microrealestate/commonui/components/PublicLayout';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { WelcomeIllustration } from '@/components/illustrations';

export default async function SignInLayout({
  children
}: {
  children: ReactNode;
}) {
  const t = await getTranslations('common');

  return (
    <PublicLayout subtitle={t('Tenant')} illustration={<WelcomeIllustration />}>
      {children}
    </PublicLayout>
  );
}
