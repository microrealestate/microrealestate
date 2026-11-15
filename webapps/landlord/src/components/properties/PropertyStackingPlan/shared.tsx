import { useTranslations } from 'next-intl';
import { NOT_FOR_RENT, type Unit } from '../composition';

export function useStatusLabel() {
  const t = useTranslations('common');
  return (status?: string) =>
    status === 'vacant'
      ? t('Vacant')
      : status === NOT_FOR_RENT
        ? t('Non-rental')
        : t('Occupied');
}

export function EmptyGroup() {
  const t = useTranslations('common');
  return (
    <p className="text-xs text-muted-foreground">
      {t('No property is attached to this one')}
    </p>
  );
}

export const TICKED = 'border-primary bg-primary/10 text-foreground';

export function usePropertyHref() {
  return (unit: Unit) => `/properties/${unit._id}`;
}
