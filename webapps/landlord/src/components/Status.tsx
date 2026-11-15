import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { cn } from '@microrealestate/commonui/utils';
import type { ReactNode } from 'react';

export type StatusVariant = 'default' | 'muted' | 'success' | 'warning';

const DOTS: Record<StatusVariant, string> = {
  default: 'border-2 border-muted-foreground',
  muted: 'border-2 border-dashed border-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning'
};

export default function Status({
  variant = 'default',
  children
}: {
  variant?: StatusVariant;
  children: ReactNode;
}) {
  return (
    <Badge
      variant={
        variant === 'default'
          ? 'secondary'
          : variant === 'muted'
            ? 'outline'
            : variant
      }
      className="gap-1.5 whitespace-nowrap"
    >
      <span
        className={cn('size-2 shrink-0 rounded-full', DOTS[variant])}
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
}
