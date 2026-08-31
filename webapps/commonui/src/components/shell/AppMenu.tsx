'use client';

import { SheetClose } from '@microrealestate/commonui/components/ui/sheet';
import type { MenuItem } from './SideMenuButton';
import { SideMenuButton } from './SideMenuButton';

export function AppMenu({
  menuItems,
  selectedMenuItem,
  autoClose = false,
  onMenuClick
}: {
  menuItems: MenuItem[];
  selectedMenuItem: MenuItem | null;
  autoClose?: boolean;
  onMenuClick: (item: MenuItem) => void;
}) {
  return (
    <div className="grow overflow-auto">
      {menuItems.map((item) => (
        <div key={item.key}>
          {autoClose ? (
            <SheetClose asChild>
              <SideMenuButton
                item={item}
                selected={item === selectedMenuItem}
                onClick={() => onMenuClick(item)}
              />
            </SheetClose>
          ) : (
            <SideMenuButton
              item={item}
              selected={item === selectedMenuItem}
              onClick={() => onMenuClick(item)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
