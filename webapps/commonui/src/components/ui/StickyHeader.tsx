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

    // Stick right under what the app shell pins at the top (environment
    // strip + top bar); 0 outside the shell
    const offset =
      Number.parseFloat(
        getComputedStyle(sentinel).getPropertyValue('--shell-top')
      ) || 0;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${offset + 1}px 0px 0px 0px`, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        className={cn(
          'sticky top-(--shell-top,0px) z-40 bg-card p-3 transition-shadow',
          // Stuck: flush edge to edge on phones, a floating card from md up
          stuck
            ? '-mx-4 rounded-none border-b md:mx-0 md:rounded-lg md:border md:shadow-md'
            : 'rounded-lg border',
          className
        )}
      >
        {children}
      </div>
    </>
  );
}
