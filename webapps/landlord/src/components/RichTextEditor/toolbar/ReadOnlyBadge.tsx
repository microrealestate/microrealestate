import { Badge } from '@microrealestate/commonui/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@microrealestate/commonui/components/ui/tooltip';
import { useTranslations } from 'next-intl';
import { LuLock } from 'react-icons/lu';

export default function ReadOnlyBadge({ reason }: { reason?: string }) {
  const t = useTranslations('common');
  const badge = (
    <Badge variant="secondary" className="gap-1 whitespace-nowrap">
      <LuLock className="size-3" />
      {t('Read only')}
    </Badge>
  );

  if (!reason) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger className="rounded-full">{badge}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-72">
        {reason}
      </TooltipContent>
    </Tooltip>
  );
}
