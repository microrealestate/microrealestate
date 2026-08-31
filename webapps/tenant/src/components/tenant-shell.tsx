'use client';

import { Shell } from '@microrealestate/commonui/components/shell/Shell';
import type { MenuItem } from '@microrealestate/commonui/components/shell/SideMenuButton';
import { useSession } from '@microrealestate/commonui/providers/SessionProvider';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useMemo } from 'react';
import { BsReceipt } from 'react-icons/bs';
import { LuMail } from 'react-icons/lu';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { BASE_PATH } from '@/utils/basepath';
import apiClient from '@/utils/fetch/client';

export function TenantShell({ children }: { children: ReactNode }) {
  const { session, status } = useSession();
  const router = useRouter();

  const t = useTranslations('common');

  const menuItems = useMemo(
    () => [
      {
        key: 'noticesandreceipts',
        label: t('Notices and receipts'),
        pathname: '/noticesandreceipts',
        subPathnames: ['/noticesandreceipts/[tenantId]'],
        Icon: BsReceipt,
        dataCy: 'noticesandreceiptsNav'
      },
      {
        key: 'contactus',
        label: t('Contact us'),
        pathname: '/contactus',
        Icon: LuMail,
        dataCy: 'contactusNav'
      }
    ],
    [t]
  );

  const handleMenuClick = useCallback(
    (menuItem: MenuItem) => {
      if (menuItem.pathname) {
        router.push(menuItem.pathname);
      }
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await apiClient.delete('/api/v2/authenticator/tenant/signout');
    } catch (error) {
      console.error(error);
      toast(t('Please try again later.'));
    }
    window.location.href = `${BASE_PATH}/signin`;
  }, [t]);

  if (status !== 'authenticated') {
    return <>{children}</>;
  }

  return (
    <Shell
      user={{ email: session?.email }}
      onSignOut={handleSignOut}
      menuItems={menuItems}
      onMenuClick={handleMenuClick}
    >
      <div className="flex flex-col items-center min-h-screen">
        <div className="w-full my-5 px-4 sm:px-6 sm:max-w-4xl">{children}</div>
      </div>
    </Shell>
  );
}
