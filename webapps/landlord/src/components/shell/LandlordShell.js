'use client';

import { Shell } from '@microrealestate/commonui/components/shell/Shell';
import Loading from '@microrealestate/commonui/components/ui/Loading';
import { useSession } from '@microrealestate/commonui/providers/SessionProvider';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import DonateDialog from '@/components/DonateDialog';
import SponsorLink from '@/components/SponsorLink';
import leftMenuItemsRaw from '@/components/shell/leftmenuitems';
import rightMenuItemsRaw from '@/components/shell/rightmenuitems';
import useDonatePrompt from '@/hooks/useDonatePrompt';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useNav } from '@/providers/NavProvider';
import { useStore } from '@/providers/StoreProvider';
import { BASE_PATH } from '@/utils/basepath';
import { fetchTodos, QueryKeys } from '@/utils/restcalls';

function LandlordShell({ children }) {
  const { session } = useSession();
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const { redirectTo } = useNav();
  const [signingOut, setSigningOut] = useState(false);
  const initialized = useRef(false);
  const donatePrompt = useDonatePrompt();

  if (!initialized.current && session?.account && session?.accessToken) {
    store.user.setUserFromSession(session.account, session.accessToken);
    // the session carries a partial organization (no currency, thirdParties nor
    // isCompany): seed it so the shell renders right away
    if (session.account.organization) {
      store.organization.setSelected(session.account.organization);
    }
    initialized.current = true;
  }

  const { data: todos } = useQuery({
    queryKey: [QueryKeys.TODOS],
    queryFn: fetchTodos
  });

  const showDonateDialog =
    donatePrompt.shouldShow && pathname.endsWith('/dashboard');

  const isSetupRoute =
    pathname.startsWith('/setuporganization') ||
    pathname.startsWith('/setupdomain');

  // Compute Left Menu Items
  const menuItems = useMemo(
    () =>
      isSetupRoute
        ? []
        : leftMenuItemsRaw
            .map((item) => {
              const menuItem = { ...item, label: t(item.labelId) };
              if (item.key === 'todo') {
                menuItem.badge = todos?.length;
              }
              return menuItem;
            })
            .filter((item) => (item.key === 'todo' ? todos?.length > 0 : true)),
    [t, todos, isSetupRoute]
  );

  const handleMenuClick = useCallback(
    (menuItem) => {
      let itemPathname = menuItem.pathname.replace(
        '[yearMonth]',
        moment().format('YYYY.MM')
      );
      itemPathname = itemPathname.replace('[year]', moment().year());
      router.push(`${itemPathname}`);
    },
    [router]
  );

  // Compute Right Menu Items
  const userMenuItems = useMemo(() => {
    if (isSetupRoute) {
      return [];
    }

    const translate = (menuGroup) =>
      menuGroup.map((item) => ({
        ...item,
        label: t(item.labelId)
      }));

    return rightMenuItemsRaw.map(translate);
  }, [t, isSetupRoute]);

  const handleUserMenuClick = useCallback(
    (menuItem) => {
      router.push(`${menuItem.pathname}`);
    },
    [router]
  );

  const handleSignOut = useCallback(() => {
    setSigningOut(true);
    store.user.signOut();
    redirectTo(`${BASE_PATH}/signin`);
  }, [store.user, redirectTo]);

  if (signingOut) {
    return <Loading fullScreen />;
  }

  return (
    <>
      <Shell
        organizationName={store.organization.selected?.name}
        user={{
          firstName: store.user?.firstName,
          lastName: store.user?.lastName,
          email: store.user?.email
        }}
        menuItems={menuItems}
        userMenuItems={userMenuItems}
        onMenuClick={handleMenuClick}
        onUserMenuClick={handleUserMenuClick}
        onSignOut={handleSignOut}
        userMenuFooter={<SponsorLink dataCy="sponsorMenuLink" />}
      >
        {children}
      </Shell>
      <DonateDialog
        open={showDonateDialog}
        canDismissForever={donatePrompt.canDismissForever}
        onSnooze={donatePrompt.snooze}
        onDismissForever={donatePrompt.dismissForever}
      />
    </>
  );
}

export default observer(LandlordShell);
