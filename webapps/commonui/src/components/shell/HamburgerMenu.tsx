'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@microrealestate/commonui/components/ui/sheet';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { LuMenu } from 'react-icons/lu';
import { AppMenu } from './AppMenu';
import type { MenuItem } from './SideMenuButton';

export function HamburgerMenu({
  className,
  organizationName,
  menuItems,
  selectedMenuItem,
  hasBadge = false,
  onMenuClick
}: {
  className?: string;
  organizationName?: string;
  menuItems: MenuItem[];
  selectedMenuItem: MenuItem | null;
  hasBadge?: boolean;
  onMenuClick: (item: MenuItem) => void;
}) {
  const t = useTranslations('common');

  return (
    <div className={cn('flex shrink-0 items-center', className)}>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-11 shrink-0 text-muted-foreground [&_svg]:size-5"
            aria-label={t('Menu')}
            data-cy="appMenu"
          >
            <LuMenu />
            {hasBadge ? (
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary" />
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col gap-0 px-0">
          <SheetHeader className="text-left">
            {organizationName ? (
              <>
                <SheetTitle className="px-4">{organizationName}</SheetTitle>
                <SheetDescription className="px-4">
                  MicroRealEstate
                </SheetDescription>
                <Separator className="bg-secondary-foreground/25 mt-4" />
              </>
            ) : (
              <>
                <SheetTitle className="px-4">MicroRealEstate</SheetTitle>
                <Separator className="bg-secondary-foreground/25 mt-4" />
              </>
            )}
          </SheetHeader>
          <AppMenu
            menuItems={menuItems}
            selectedMenuItem={selectedMenuItem}
            onMenuClick={onMenuClick}
            autoClose
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
