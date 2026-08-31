'use client';

import { cn } from '@microrealestate/commonui/utils';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { EnvironmentBar } from './EnvironmentBar';
import { HamburgerMenu } from './HamburgerMenu';
import { LeftBar } from './LeftBar';
import { RightBar } from './RightBar';
import type { MenuItem } from './SideMenuButton';

export function Shell({
  children,
  organizationName,
  user,
  menuItems = [],
  userMenuItems = [[], []],
  onMenuClick,
  onUserMenuClick,
  onSignOut,
  userMenuFooter
}: {
  children: ReactNode;
  organizationName?: string;
  user: { firstName?: string; lastName?: string; email?: string };
  menuItems?: MenuItem[];
  userMenuItems?: MenuItem[][];
  onMenuClick?: (item: MenuItem) => void;
  onUserMenuClick?: (item: MenuItem) => void;
  onSignOut?: () => void;
  userMenuFooter?: ReactNode;
}) {
  const isXLorGreater = useMediaQuery('(min-width: 1280px)');
  const pathname = usePathname();
  const t = useTranslations('common');

  const showLeftAndHamburger = menuItems.length > 0;

  const isHamburgerMenuVisible = showLeftAndHamburger && !isXLorGreater;
  const isLeftBarVisible = showLeftAndHamburger && isXLorGreater;
  const isRightBarVisible = !!user;

  // Find the most specific best-matching menu item based on current URL
  const findBestMatch = useCallback(
    (items: MenuItem[]) => {
      let bestMatch: MenuItem | null = null;
      let bestScore = -1;

      items.forEach((item) => {
        const paths = [item.pathname, ...(item.subPathnames || [])].filter(
          Boolean
        ) as string[];
        for (const p of paths) {
          // Strip dynamic route params (e.g. /rents/[yearMonth] -> /rents)
          const base = p.split('[')[0].replace(/\/$/, '');

          // Safely check if the pathname includes the base folder (e.g. /rents/)
          if (base && `${pathname}/`.includes(`${base}/`)) {
            if (base.length > bestScore) {
              bestScore = base.length;
              bestMatch = item;
            }
          }
        }
      });

      return bestMatch;
    },
    [pathname]
  );

  const selectedMenuItem = useMemo(
    () => findBestMatch(menuItems),
    [findBestMatch, menuItems]
  );
  const selectedUserMenuItem = useMemo(
    () => findBestMatch(userMenuItems.flat()),
    [findBestMatch, userMenuItems]
  );

  return (
    <>
      <div className="sticky top-0 z-50 shadow-sm">
        <EnvironmentBar />
        {isRightBarVisible ? (
          <div className="flex items-center xl:justify-end bg-card w-full gap-2 py-1">
            {isHamburgerMenuVisible ? (
              <HamburgerMenu
                organizationName={organizationName}
                menuItems={menuItems}
                selectedMenuItem={selectedMenuItem}
                onMenuClick={(item) => onMenuClick?.(item)}
              />
            ) : null}
            <RightBar
              user={user}
              userMenuItems={userMenuItems}
              selectedMenu={selectedUserMenuItem}
              onMenuClick={onUserMenuClick}
              onSignOut={onSignOut}
              signOutLabel={t('Sign out')}
              userMenuFooter={userMenuFooter}
            />
          </div>
        ) : null}
      </div>
      <div className="flex">
        {isLeftBarVisible ? (
          <LeftBar
            organizationName={organizationName}
            menuItems={menuItems}
            selectedMenuItem={selectedMenuItem}
            onMenuClick={(item) => onMenuClick?.(item)}
          />
        ) : null}
        <div className={cn('grow min-w-0', isLeftBarVisible ? 'ml-60' : '')}>
          {children}
        </div>
      </div>
    </>
  );
}
