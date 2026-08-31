import { cn } from '@microrealestate/commonui/utils';
import { LuLoaderCircle } from 'react-icons/lu';

interface LoadingProps {
  fullScreen?: boolean;
  className?: string;
}

export default function Loading({
  fullScreen = true,
  className
}: LoadingProps) {
  return fullScreen ? (
    <div
      className={cn(
        'z-50 fixed top-0 left-0 right-0 h-full flex items-center justify-center',
        className
      )}
    >
      <LuLoaderCircle className="animate-spin text-primary size-12" />
    </div>
  ) : (
    <div
      className={cn(
        'z-50 flex items-center justify-center bg-card/20',
        className
      )}
    >
      <LuLoaderCircle className="animate-spin text-primary size-12" />
    </div>
  );
}
