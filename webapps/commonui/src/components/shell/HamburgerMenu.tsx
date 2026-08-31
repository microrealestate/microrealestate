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
import { LuMenu } from 'react-icons/lu';
import { AppMenu } from './AppMenu';
import type { MenuItem } from './SideMenuButton';

export function HamburgerMenu({
  className,
  organizationName,
  menuItems,
  selectedMenuItem,
  onMenuClick
}: {
  className?: string;
  organizationName?: string;
  menuItems: MenuItem[];
  selectedMenuItem: MenuItem | null;
  onMenuClick: (item: MenuItem) => void;
}) {
  return (
    <div className={cn('flex grow items-center z-40', className)}>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            data-cy="appMenu"
            className="text-muted-foreground bg-card hover:bg-card"
          >
            <LuMenu />
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
      {selectedMenuItem ? (
        <span className="whitespace-nowrap ml-2">{selectedMenuItem.label}</span>
      ) : null}
    </div>
  );
}
