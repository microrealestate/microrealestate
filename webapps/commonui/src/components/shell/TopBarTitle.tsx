'use client';

import { cn } from '@microrealestate/commonui/utils';
import { useTopBarTitleSlot } from './TopBarTitleSlot';

export function TopBarTitle({
  title,
  organizationName,
  className
}: {
  title?: string;
  organizationName?: string;
  className?: string;
}) {
  const { setSlot, hasPageTitle } = useTopBarTitleSlot();

  return (
    <div className={cn('flex flex-col min-w-0 grow leading-tight', className)}>
      <div ref={setSlot} className="flex min-w-0 items-center" />
      {!hasPageTitle && title ? (
        <h1 className="font-semibold truncate">{title}</h1>
      ) : null}
      {organizationName ? (
        <span className="text-xs text-muted-foreground truncate xl:hidden">
          {organizationName}
        </span>
      ) : null}
    </div>
  );
}
