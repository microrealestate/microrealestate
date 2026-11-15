import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { useTranslations } from 'next-intl';
import { displayStatus, NOT_FOR_RENT, type Unit } from './composition';

export default function PropertyStatusBadge({ property }: { property: Unit }) {
  const t = useTranslations('common');
  const status = displayStatus(property);

  return (
    <Badge
      variant={
        status === 'vacant'
          ? 'success'
          : status === NOT_FOR_RENT
            ? 'outline'
            : 'secondary'
      }
    >
      {status === 'vacant'
        ? t('Vacant')
        : status === NOT_FOR_RENT
          ? t('Non-rental')
          : t('Occupied')}
    </Badge>
  );
}
