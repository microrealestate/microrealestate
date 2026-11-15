'use client';

import { Shell } from '@microrealestate/commonui/components/shell/Shell';
import Loading from '@microrealestate/commonui/components/ui/Loading';
import { useSession } from '@microrealestate/commonui/providers/SessionProvider';
import { landlordName } from '@microrealestate/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import DonateDialog from '@/components/DonateDialog';
import SponsorLink from '@/components/SponsorLink';
import leftMenuItemsRaw from '@/components/shell/leftmenuitems';
import rightMenuGroupsRaw from '@/components/shell/rightmenuitems';
import UpdateAvailableButton from '@/components/UpdateAvailableButton';
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { redirectTo } = useNav();
  const [signingOut, setSigningOut] = useState(false);
  const initialized = useRef(false);
  const donatePrompt = useDonatePrompt();

  if (!initialized.current && session?.account && session?.accessToken) {
    store.user.setUserFromSession(session.account, session.accessToken);
    const organization =
      queryClient.getQueryData([QueryKeys.ORGANIZATION]) ??
      session.account.organization;
    if (organization) {
      store.organization.setSelected(organization);
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

  const userMenuGroups = useMemo(() => {
    if (isSetupRoute) {
      return [];
    }

    return rightMenuGroupsRaw.map((group) => ({
      key: group.key,
      label: group.labelId ? t(group.labelId) : undefined,
      withThemeSwitch: group.withThemeSwitch,
      withAbout: group.withAbout,
      items: group.items.map((item) => ({ ...item, label: t(item.labelId) }))
    }));
  }, [t, isSetupRoute]);

  const handleUserMenuClick = useCallback(
    (menuItem) => {
      router.push(`${menuItem.pathname}`);
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await store.user.signOut();
    } finally {
      redirectTo(`${BASE_PATH}/signin`);
    }
  }, [store.user, redirectTo]);

  if (signingOut) {
    return <Loading fullScreen />;
  }

  return (
    <>
      <Shell
        organizationName={
          store.organization.selected
            ? landlordName(store.organization.selected)
            : undefined
        }
        user={{
          firstName: store.user?.firstName,
          lastName: store.user?.lastName,
          email: store.user?.email
        }}
        menuItems={menuItems}
        userMenuGroups={userMenuGroups}
        onMenuClick={handleMenuClick}
        onUserMenuClick={handleUserMenuClick}
        onSignOut={handleSignOut}
        userMenuFooter={<SponsorLink compact dataCy="sponsorMenuLink" />}
        topBarActions={isSetupRoute ? null : <UpdateAvailableButton />}
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
