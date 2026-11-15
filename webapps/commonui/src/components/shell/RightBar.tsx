'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@microrealestate/commonui/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { LuChevronDown, LuInfo, LuLogOut } from 'react-icons/lu';
import { useMediaQuery } from 'usehooks-ts';
import AboutDialog from './AboutDialog';
import type { MenuGroup, MenuItem } from './SideMenuButton';
import { SideMenuButton } from './SideMenuButton';
import ThemeSwitch from './ThemeSwitch';
import { UserAvatar } from './UserAvatar';

type User = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
};

function displayName(user: User) {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.email || '';
}

function UserMenuHeader({ user, name }: { user: User; name: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <UserAvatar user={user} size="lg" />
      <div className="flex flex-col min-w-0">
        <span className="font-medium truncate">{name}</span>
        {user.email && user.email !== name ? (
          <span className="text-sm text-muted-foreground truncate">
            {user.email}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MenuHeading({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function UserMenuItems({
  userMenuGroups,
  selectedMenu,
  signOutLabel,
  footer,
  onMenuClick,
  onAbout,
  onSignOut
}: {
  userMenuGroups: MenuGroup[];
  selectedMenu?: MenuItem | null;
  signOutLabel: string;
  footer?: ReactNode;
  onMenuClick: (item: MenuItem) => void;
  onAbout?: () => void;
  onSignOut: () => void;
}) {
  const t = useTranslations('common');
  const separator = <Separator className="bg-secondary-foreground/25 my-2" />;
  const groups = userMenuGroups.filter(
    (group) =>
      group.items.length > 0 ||
      group.withThemeSwitch ||
      (group.withAbout && !!onAbout)
  );

  const [personalGroup, ...otherGroups] = groups;
  const themeSwitchInGroup = otherGroups.some((group) => group.withThemeSwitch);
  const aboutInGroup = otherGroups.some((group) => group.withAbout);
  const aboutButton = onAbout ? (
    <SideMenuButton
      item={{
        key: 'about',
        Icon: LuInfo,
        label: t('About'),
        dataCy: 'aboutNav'
      }}
      onClick={onAbout}
    />
  ) : null;

  const renderItems = (items: MenuItem[]) => (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <SideMenuButton
          key={item.key}
          item={item}
          selected={item === selectedMenu}
          onClick={() => onMenuClick(item)}
        />
      ))}
    </div>
  );

  return (
    <>
      {personalGroup ? renderItems(personalGroup.items) : null}
      {themeSwitchInGroup ? null : <ThemeSwitch />}
      {otherGroups.map((group) => (
        <div key={group.key}>
          {separator}
          {group.label ? <MenuHeading>{group.label}</MenuHeading> : null}
          {group.withThemeSwitch ? <ThemeSwitch /> : null}
          <div className="flex flex-col gap-0.5">
            {renderItems(group.items)}
            {group.withAbout ? aboutButton : null}
          </div>
        </div>
      ))}
      {separator}
      {aboutInGroup ? null : aboutButton}
      <SideMenuButton
        item={{
          key: 'signout',
          Icon: LuLogOut,
          label: signOutLabel,
          dataCy: 'signoutNav'
        }}
        onClick={onSignOut}
      />
      {footer ? (
        <>
          {separator}
          <div className="flex justify-end px-4 pt-1">{footer}</div>
        </>
      ) : null}
    </>
  );
}

export function RightBar({
  user,
  userMenuGroups = [],
  selectedMenu,
  onMenuClick,
  onSignOut,
  signOutLabel = 'Sign out',
  userMenuFooter,
  showAbout = true
}: {
  user: User;
  userMenuGroups?: MenuGroup[];
  selectedMenu?: MenuItem | null;
  onMenuClick?: (item: MenuItem) => void;
  onSignOut?: () => void;
  signOutLabel?: string;
  userMenuFooter?: ReactNode;
  showAbout?: boolean;
}) {
  const t = useTranslations('common');
  const isXLorGreater = useMediaQuery('(min-width: 1280px)');
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const name = displayName(user);

  const openAbout = () => {
    setOpen(false);
    setAboutOpen(true);
  };

  const menuItems = (
    <UserMenuItems
      userMenuGroups={userMenuGroups}
      selectedMenu={selectedMenu}
      signOutLabel={signOutLabel}
      footer={userMenuFooter}
      onMenuClick={(item) => {
        setOpen(false);
        onMenuClick?.(item);
      }}
      onAbout={showAbout ? openAbout : undefined}
      onSignOut={() => {
        setOpen(false);
        onSignOut?.();
      }}
    />
  );

  return (
    <div className="flex items-center justify-end gap-1 shrink-0">
      {isXLorGreater ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-11 gap-2 px-2 data-[state=open]:bg-accent"
              aria-label={t('User menu')}
              data-cy="orgMenu"
            >
              <UserAvatar user={user} />
              <span className="max-w-48 truncate">{name}</span>
              <LuChevronDown className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 max-h-[calc(100svh-5rem)] overflow-y-auto p-0 py-2"
          >
            <div className="px-4 pt-2 pb-3">
              <UserMenuHeader user={user} name={name} />
            </div>
            <Separator className="bg-secondary-foreground/25 mb-2" />
            {menuItems}
          </PopoverContent>
        </Popover>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full data-[state=open]:bg-accent"
              aria-label={t('User menu')}
              data-cy="orgMenu"
            >
              <UserAvatar user={user} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-0 px-0">
            <SheetHeader className="px-4 pr-12 text-left">
              <SheetTitle className="sr-only">{name}</SheetTitle>
              <UserMenuHeader user={user} name={name} />
            </SheetHeader>
            <Separator className="bg-secondary-foreground/25 my-4" />
            <div className="grow overflow-auto">{menuItems}</div>
          </SheetContent>
        </Sheet>
      )}
      {showAbout ? (
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      ) : null}
    </div>
  );
}
