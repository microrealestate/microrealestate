import { Badge } from '../../components/ui/badge';
import { Button } from '../ui/button';
import { Card } from '../../components/ui/card';
import NumberFormat from '../../components/NumberFormat';
import PropertyIcon from './PropertyIcon';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

export default function PropertyListItem({ property }) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const onClick = useCallback(async () => {
    await router.push(
      `/${property.name}/properties/${property._id}/${encodeURI(
        t('Properties')
      )}/${encodeURIComponent(router.asPath)}`
    );
  }, [property._id, property.name, router, t]);

  return (
    <Card className="p-4 cursor-pointer hover:bg-accent/90" onClick={onClick}>
      <div className="flex flex-col md:items-end md:flex-row md:justify-between">
        <div>
          <Badge
            variant={property.status === 'vacant' ? 'success' : 'secondary'}
            className="w-fit border border-secondary-foreground/20"
          >
            {property.status === 'vacant' ? t('Vacant') : t('Rented')}
          </Badge>
          <Button
            variant="link"
            className="flex items-center font-normal gap-2 p-0 mt-2"
          >
            <PropertyIcon type={property.type} />
            <span className="text-xl">{property.name}</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {property.description}
          </span>
        </div>

        <div className="md:text-right">
          <p className="text-sm text-muted-foreground">
            {t('Rent excluding tax and expenses')}
          </p>
          <div className="text-2xl font-semibold">
            <NumberFormat value={property.price} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {property.status !== 'vacant' && (
          <p className="text-sm text-muted-foreground">
            {t('Occupied by {{tenant}}', {
              tenant: property.occupantLabel
            })}
          </p>
        )}
      </div>
    </Card>
  );
}
