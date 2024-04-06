import { cn } from '../utils';
import { RotateCwIcon } from 'lucide-react';

export default function Loading({ fullScreen = true, className }) {
  return fullScreen ? (
    <div
      className={cn(
        'fixed left-0 top-16 right-0 bottom-0 flex items-center justify-center',
        'xl:left-60',
        className
      )}
    >
      <RotateCwIcon className="animate-spin text-primary z-50" size={32} />
    </div>
  ) : (
    <div className={cn('flex items-center justify-center', className)}>
      <RotateCwIcon className="animate-spin text-primary z-50" size={32} />
    </div>
  );
}
