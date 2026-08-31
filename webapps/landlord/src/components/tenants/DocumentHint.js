import { cn } from '@microrealestate/commonui/utils';
import { LuCheck, LuInfo, LuTriangleAlert } from 'react-icons/lu';

const SEVERITY_HINT = {
  error: { className: 'text-destructive', Icon: LuTriangleAlert },
  warning: { className: 'text-muted-foreground', Icon: LuInfo },
  success: { className: 'text-success', Icon: LuCheck },
  info: { className: 'text-muted-foreground', Icon: LuInfo }
};

export default function DocumentHint({ severity, message }) {
  if (!message) return null;

  const hint = SEVERITY_HINT[severity];
  return (
    <div className={cn('flex items-center gap-1 text-sm', hint.className)}>
      <hint.Icon className="size-5" />
      <span>{message}</span>
    </div>
  );
}
