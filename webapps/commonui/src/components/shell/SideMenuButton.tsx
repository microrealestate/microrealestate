'use client';

import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { cn } from '@microrealestate/commonui/utils';
import type { ElementType } from 'react';

export type MenuItem = {
  key: string;
  Icon?: ElementType;
  label: string;
  pathname?: string;
  subPathnames?: string[];
  dataCy?: string;
  badge?: number | null;
};

export type MenuGroup = {
  key: string;
  label?: string;
  items: MenuItem[];
  withThemeSwitch?: boolean;
  withAbout?: boolean;
};

export function SideMenuButton({
  item,
  selected,
  className,
  onClick
}: {
  item: MenuItem;
  selected?: boolean;
  className?: string;
  onClick: () => void;
}) {
  const badge = item.badge && item.badge > 0 ? item.badge : null;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'h-10 mx-2 w-[calc(100%-1rem)] justify-start gap-3 px-3 font-normal [&_svg]:size-5',
        selected
          ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
      data-cy={item.dataCy}
    >
      {item.Icon ? (
        <item.Icon
          className={selected ? 'text-primary' : 'text-muted-foreground'}
        />
      ) : null}
      <span className="truncate">{item.label}</span>
      {badge ? (
        <Badge
          variant="default"
          className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-xs"
        >
          {badge > 99 ? '99+' : badge}
        </Badge>
      ) : null}
    </Button>
  );
}
