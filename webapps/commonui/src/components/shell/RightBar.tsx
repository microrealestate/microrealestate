'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@microrealestate/commonui/components/ui/sheet';
import type { ReactNode } from 'react';
import { LuLogOut } from 'react-icons/lu';
import type { MenuItem } from './SideMenuButton';
import { SideMenuButton } from './SideMenuButton';
import ThemeToggle from './ThemeToggle';
import { UserAvatar } from './UserAvatar';
import VersionBadge from './VersionBadge';

export function RightBar({
  user,
  userMenuItems = [[], []],
  selectedMenu,
  onMenuClick,
  onSignOut,
  signOutLabel = 'Sign out',
  userMenuFooter
}: {
  user: { firstName?: string; lastName?: string; email?: string };
  userMenuItems?: MenuItem[][];
  selectedMenu?: MenuItem | null;
  onMenuClick?: (item: MenuItem) => void;
  onSignOut?: () => void;
  signOutLabel?: string;
  userMenuFooter?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-end w-full gap-1 pr-4">
      <ThemeToggle />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="size-fit p-0 rounded-full"
            data-cy="orgMenu"
          >
            <UserAvatar user={user} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col gap-0 px-0">
          <SheetHeader className="flex flex-row items-center px-4">
            <SheetTitle>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email || ''}
            </SheetTitle>
          </SheetHeader>
          <Separator className="bg-secondary-foreground/25 my-4" />
          <div className="grow overflow-auto">
            <div className="flex flex-col">
              {userMenuItems[0]?.map((item: MenuItem) => (
                <SheetClose key={item.key} asChild>
                  <SideMenuButton
                    item={item}
                    selected={item === selectedMenu}
                    onClick={() => onMenuClick?.(item)}
                  />
                </SheetClose>
              ))}
            </div>

            {userMenuItems[1]?.length > 0 ? (
              <>
                <Separator className="bg-secondary-foreground/25 my-4" />
                <div className="flex flex-col">
                  {userMenuItems[1].map((item: MenuItem) => (
                    <SheetClose key={item.key} asChild>
                      <SideMenuButton
                        item={item}
                        selected={item === selectedMenu}
                        onClick={() => onMenuClick?.(item)}
                      />
                    </SheetClose>
                  ))}
                </div>
                <Separator className="bg-secondary-foreground/25 my-4" />
              </>
            ) : null}
          </div>
          {userMenuFooter ? (
            <div className="px-4 pb-3 pt-2">{userMenuFooter}</div>
          ) : null}
          <SheetClose asChild>
            <SideMenuButton
              item={{
                key: 'signout',
                Icon: LuLogOut,
                label: signOutLabel,
                dataCy: 'signoutNav'
              }}
              onClick={() => onSignOut?.()}
            />
          </SheetClose>
          <VersionBadge />
        </SheetContent>
      </Sheet>
    </div>
  );
}
