import { cn } from '@/utils';

export interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const className = 'flex items-center gap-1 text-base font-semibold';

  if (variant === 'success') {
    return (
      <div className={cn(className, 'text-success')}>
        <div className="h-2 w-2 rounded-full bg-success" />
        {children}
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div className={cn(className, 'text-warning')}>
        <div className="h-2 w-2 rounded-full bg-warning" />
        {children}
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className={cn(className, 'text-destructive')}>
        <div className="h-2 w-2 rounded-full bg-destructive" />
        {children}
      </div>
    );
  }

  if (variant === 'info') {
    return (
      <div className={cn(className, 'text-info')}>
        <div className="h-2 w-2 rounded-full bg-info" />
        {children}
      </div>
    );
  }

  return (
    <div className={cn(className, 'text-muted-foreground')}>
      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
      {children}
    </div>
  );
}
