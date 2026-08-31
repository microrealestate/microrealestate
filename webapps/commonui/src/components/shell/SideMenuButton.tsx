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
  return (
    <Button
      variant={selected ? 'default' : 'ghost'}
      onClick={onClick}
      className={cn(
        'border-none rounded-none shadow-none h-12 w-full justify-between gap-0 text-foreground',
        selected
          ? 'bg-primary text-primary-foreground disabled:opacity-100'
          : 'bg-transparent hover:bg-primary/10',
        className
      )}
      data-cy={item.dataCy}
    >
      <div className="flex gap-1">
        {item.Icon ? <item.Icon className="size-6" /> : null}
        <span>{item.label}</span>
      </div>
      {item.badge && item.badge > 0 && (
        <Badge
          variant="default"
          className={cn(
            'flex items-center px-1 py-0.5 -mr-2.5',
            selected ? 'border-1 border-primary-foreground' : ''
          )}
        >
          <span className="pt-0.5 text-xs font-medium min-w-3.5">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        </Badge>
      )}
    </Button>
  );
}
