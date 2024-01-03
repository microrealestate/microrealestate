'use client';

import { Button } from '@/components/ui/button';
import getEnv from '@/utils/env/client';
import { LogOut } from 'lucide-react';
import useApiFetcher from '@/utils/fetch/client';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';

export function SignOutNav() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await apiFetcher.delete('/api/v2/authenticator/tenant/signout');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Something went wrong'),
        description: t('Please try again later.'),
      });
    }
    window.location.href = `${getEnv('BASE_PATH') || ''}/signin`;
  };

  return (
    <div className="flex items-center justify-center -mr-4">
      <Button variant="ghost" onClick={handleSignOut}>
        {t('Sign out')}
        <LogOut className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
