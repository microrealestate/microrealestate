'use client';

import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { cn } from '@microrealestate/commonui/utils';
import { AppMenu } from './AppMenu';
import type { MenuItem } from './SideMenuButton';

export function LeftBar({
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
    <div
      className={cn(
        'bg-card flex flex-col fixed w-60 h-full z-50 border-r',
        className
      )}
    >
      {organizationName ? (
        <>
          <div className="whitespace-nowrap text-2xl font-semibold px-4 -mt-10">
            {organizationName}
          </div>
          <div className="text-muted-foreground px-4 mt-2">MicroRealEstate</div>
          <Separator className="bg-secondary-foreground/25 mt-4" />
        </>
      ) : (
        <>
          <div className="whitespace-nowrap text-2xl font-semibold px-4 -mt-10">
            MicroRealEstate
          </div>
          <Separator className="bg-secondary-foreground/25 mt-2" />
        </>
      )}
      <AppMenu
        menuItems={menuItems}
        selectedMenuItem={selectedMenuItem}
        onMenuClick={onMenuClick}
      />
    </div>
  );
}
