import PublicLayout from '@microrealestate/commonui/components/PublicLayout';
import { useTranslations } from 'next-intl';
import type { PropsWithChildren } from 'react';
import { SignInUpIllustration } from '@/components/Illustrations';

export default function Layout({ children }: PropsWithChildren) {
  const t = useTranslations('common');

  return (
    <PublicLayout
      subtitle={t('Landlord')}
      illustration={<SignInUpIllustration />}
    >
      {children}
    </PublicLayout>
  );
}
