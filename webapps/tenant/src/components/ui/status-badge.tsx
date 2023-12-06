import { cn } from '@/utils';

export interface StatusBadgeProps {
  variant:
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'active'
    | 'default'
    | 'inactive'
    | 'terminated'
    | 'ended';
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const className = 'flex items-center gap-1 text-base font-semibold';

  if (['success', 'active'].includes(variant)) {
    return (
      <div className={cn(className, 'text-green-600')}>
        <div className="h-2 w-2 rounded-full bg-green-600" />
        {children}
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div className={cn(className, 'text-yellow-600')}>
        <div className="h-2 w-2 rounded-full bg-yellow-600" />
        {children}
      </div>
    );
  }

  if (['error', 'danger'].includes(variant)) {
    return (
      <div className={cn(className, 'text-red-600')}>
        <div className="h-2 w-2 rounded-full bg-red-600" />
        {children}
      </div>
    );
  }

  if (variant === 'info') {
    return (
      <div className={cn(className, 'text-blue-600')}>
        <div className="h-2 w-2 rounded-full bg-blue-600" />
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
