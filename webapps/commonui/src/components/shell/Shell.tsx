'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import {
  ENVIRONMENT_BAR_HEIGHT,
  EnvironmentBar,
  useEnvironmentMode
} from './EnvironmentBar';
import { HamburgerMenu } from './HamburgerMenu';
import { LeftBar } from './LeftBar';
import { RightBar } from './RightBar';
import type { MenuGroup, MenuItem } from './SideMenuButton';
import { TopBarTitle } from './TopBarTitle';
import { TopBarTitleProvider } from './TopBarTitleSlot';

export function Shell({
  children,
  organizationName,
  user,
  menuItems = [],
  userMenuGroups = [],
  onMenuClick,
  onUserMenuClick,
  onSignOut,
  userMenuFooter,
  topBarActions,
  showAbout = true
}: {
  children: ReactNode;
  organizationName?: string;
  user: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
  menuItems?: MenuItem[];
  userMenuGroups?: MenuGroup[];
  onMenuClick?: (item: MenuItem) => void;
  onUserMenuClick?: (item: MenuItem) => void;
  onSignOut?: () => void;
  userMenuFooter?: ReactNode;
  topBarActions?: ReactNode;
  showAbout?: boolean;
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
    (items: MenuItem[]): MenuItem | null => {
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
    () => findBestMatch(userMenuGroups.flatMap((group) => group.items)),
    [findBestMatch, userMenuGroups]
  );

  const currentTitle = (selectedMenuItem ?? selectedUserMenuItem)?.label;

  const environmentMode = useEnvironmentMode();

  const envBarHeight = environmentMode ? ENVIRONMENT_BAR_HEIGHT : 0;
  const shellTop = envBarHeight + (isRightBarVisible ? 56 : 0);

  const hasMenuBadge = menuItems.some((item) => !!item.badge && item.badge > 0);

  return (
    <TopBarTitleProvider>
      <div
        style={
          {
            '--env-bar-h': `${envBarHeight}px`,
            '--shell-top': `${shellTop}px`
          } as CSSProperties
        }
      >
        <EnvironmentBar />
        <div className="flex min-h-svh">
          {isLeftBarVisible ? (
            <LeftBar
              organizationName={organizationName}
              menuItems={menuItems}
              selectedMenuItem={selectedMenuItem}
              onMenuClick={(item) => onMenuClick?.(item)}
            />
          ) : null}
          <div className="grow min-w-0">
            <div className="sticky top-(--env-bar-h) z-50">
              {isRightBarVisible ? (
                <header className="flex items-center h-14 gap-2 px-2 xl:px-6 bg-card border-b">
                  {isHamburgerMenuVisible ? (
                    <HamburgerMenu
                      organizationName={organizationName}
                      menuItems={menuItems}
                      selectedMenuItem={selectedMenuItem}
                      hasBadge={hasMenuBadge}
                      onMenuClick={(item) => onMenuClick?.(item)}
                    />
                  ) : null}
                  <TopBarTitle
                    title={currentTitle}
                    organizationName={organizationName}
                  />
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    {topBarActions}
                    <RightBar
                      user={user}
                      userMenuGroups={userMenuGroups}
                      selectedMenu={selectedUserMenuItem}
                      onMenuClick={onUserMenuClick}
                      onSignOut={onSignOut}
                      signOutLabel={t('Sign out')}
                      userMenuFooter={userMenuFooter}
                      showAbout={showAbout}
                    />
                  </div>
                </header>
              ) : null}
            </div>
            {children}
          </div>
        </div>
      </div>
    </TopBarTitleProvider>
  );
}
