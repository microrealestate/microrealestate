'use client';

import useTranslation from '@/utils/i18n/client/useTranslation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import config from '@/config';

export function LogoutNav() {
  const { t } = useTranslation();

  const handleLogOut = async () => {
    // middleware will redirect to /[locale]/signin
    window.location.href = `${config.BASE_PATH}/`;
  };

  return (
    <div className="flex flex-1 items-center justify-end space-x-4">
      <nav className="flex items-center justify-center space-x-2">
        <Button variant="ghost" onClick={handleLogOut}>
          {t('Log out')}
          <LogOut className="ml-2 h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}
