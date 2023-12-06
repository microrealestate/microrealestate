'use client';

import useTranslation from '@/utils/i18n/client/useTranslation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import config from '@/config';
import useApiFetcher from '@/utils/fetch/client';

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
    window.location.href = `${config.BASE_PATH}/signin`;
  };

  return (
    <div className="flex flex-1 items-center justify-end space-x-4">
      <nav className="flex items-center justify-center space-x-2">
        <Button variant="ghost" onClick={handleSignOut}>
          {t('Sign out')}
          <LogOut className="ml-2 h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}
