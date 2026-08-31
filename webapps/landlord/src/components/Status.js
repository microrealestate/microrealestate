import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { FaExclamation } from 'react-icons/fa6';
import { LuCheck } from 'react-icons/lu';

export default function Status({ variant, children }) {
  let Icon = null;
  if (variant === 'warning') {
    Icon = <FaExclamation className={`text-${variant}-foreground size-3.5`} />;
  } else if (variant === 'success') {
    Icon = <LuCheck className={`text-${variant}-foreground size-3.5`} />;
  }

  return (
    <Badge
      variant="outline"
      className="space-x-2 px-1 py-1 rounded-sm whitespace-nowrap"
    >
      {Icon ? (
        <div
          className={`flex items-center justify-center bg-${variant} size-4 rounded-full`}
        >
          {Icon}
        </div>
      ) : null}
      <div
        className={`text-xs text-${
          variant !== 'default' ? variant : 'muted-foreground font-normal'
        } whitespace-nowrap`}
      >
        {children}
      </div>
    </Badge>
  );
}
