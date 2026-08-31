import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils';

export function StickyHeader({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        className={cn(
          'sm:relative sm:top-auto sm:z-auto sticky top-0 z-50 bg-card',
          stuck
            ? 'rounded-none border-x-0 border-t-0 border-b -mx-2'
            : 'border rounded',
          className
        )}
      >
        {children}
      </div>
    </>
  );
}
