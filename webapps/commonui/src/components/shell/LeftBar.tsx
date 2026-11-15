'use client';

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
    <aside
      className={cn(
        'bg-card flex flex-col sticky top-(--env-bar-h) h-[calc(100svh-var(--env-bar-h,0))] w-60 shrink-0 z-50',
        className
      )}
    >
      <div className="flex flex-col justify-center h-14 shrink-0 px-4 border-b">
        <div
          className="text-xl font-semibold leading-tight truncate"
          title={organizationName || 'MicroRealEstate'}
        >
          {organizationName || 'MicroRealEstate'}
        </div>
        {organizationName ? (
          <div className="text-sm text-muted-foreground truncate">
            MicroRealEstate
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 grow flex-col border-r">
        <AppMenu
          menuItems={menuItems}
          selectedMenuItem={selectedMenuItem}
          onMenuClick={onMenuClick}
        />
      </div>
    </aside>
  );
}
