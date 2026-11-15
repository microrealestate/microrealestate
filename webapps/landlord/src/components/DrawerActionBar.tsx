import { cn } from '@microrealestate/commonui/utils';
import type { ReactNode } from 'react';

export default function DrawerActionBar({
  children,
  className,
  dataCy
}: {
  children: ReactNode;
  className?: string;
  dataCy?: string;
}) {
  return (
    <div
      className="mt-auto border-t pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      data-cy={dataCy}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-(--breakpoint-lg) items-center gap-2 px-4 md:justify-end md:px-8',
          '[&>*:last-child]:flex-1 md:[&>*:last-child]:flex-none',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
