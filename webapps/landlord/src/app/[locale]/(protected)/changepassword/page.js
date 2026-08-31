'use client';

import { Card } from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import ChangePasswordForm from '@/components/account/ChangePasswordForm';
import Page from '@/components/Page';

function ForcedChangePassword() {
  const t = useTranslations('common');

  return (
    <Page className="md:w-xl space-y-4" dataCy="changePasswordPage">
      <div className="text-center md:text-left text-2xl font-medium">
        {t('Choose a new password')}
      </div>
      <div className="text-center md:text-left text-muted-foreground">
        {t(
          'You are signing in with a temporary password. Choose your own to continue.'
        )}
      </div>
      <Card className="p-6">
        <ChangePasswordForm />
      </Card>
    </Page>
  );
}

export default ForcedChangePassword;
