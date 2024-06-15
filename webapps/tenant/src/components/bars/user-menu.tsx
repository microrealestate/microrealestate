'use client';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import getEnv from '@/utils/env/client';
import { Separator } from '@/components/ui/separator';
import SideMenuButton from './side-menu-button';
import useApiFetcher from '@/utils/fetch/client';
import UserAvatar from './user-avatar';
import useSession from '@/utils/session/client/usesession';
import { useToast } from '@/components/ui/use-toast';
import useTranslation from '@/utils/i18n/client/useTranslation';

export default function UserMenu() {
  const apiFetcher = useApiFetcher();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session, status } = useSession();

  const handleSignOut = async () => {
    try {
      await apiFetcher.delete('/api/v2/authenticator/tenant/signout');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Something went wrong'),
        description: t('Please try again later.')
      });
    }
    window.location.href = `${getEnv('BASE_PATH') || ''}/signin`;
  };

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div>
          <Button data-cy="userMenu" className="bg-card hover:bg-card">
            <UserAvatar />
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col px-4">
        <SheetHeader className="flex flex-row items-center">
          <SheetTitle>{session?.email || ''}</SheetTitle>
        </SheetHeader>
        <Separator className="bg-secondary-foreground/25" />
        <div>
          <SheetClose asChild>
            <SideMenuButton
              item={{
                key: 'signout',
                labelId: 'Sign out',
                dataCy: 'signoutNav'
              }}
              onClick={handleSignOut}
            />
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
