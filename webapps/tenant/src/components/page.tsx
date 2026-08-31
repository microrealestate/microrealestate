import { cn } from '@microrealestate/commonui/utils';
import type { ReactNode } from 'react';

export default function Page({
  description,
  dataCy,
  className,
  children
}: {
  description?: string;
  dataCy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className={cn('flex flex-col gap-4', className)} data-cy={dataCy}>
      {description ? (
        <h1 className="text-muted-foreground font-extrabold font-stretch-expanded text-xl sm:text-2xl">
          {description}
        </h1>
      ) : null}
      {children}
    </main>
  );
}
