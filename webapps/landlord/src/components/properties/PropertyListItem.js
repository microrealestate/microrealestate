import { useCallback, useContext } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../ui/button';
import { Card } from '../../components/ui/card';
import NumberFormat from '../../components/NumberFormat';
import PropertyIcon from './PropertyIcon';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

export default function PropertyListItem({ property }) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const onClick = useCallback(async () => {
    store.appHistory.setPreviousPath(router.asPath);
    await router.push(`/${property.name}/properties/${property._id}`);
  }, [property._id, property.name, router, store]);

  return (
    <Card className="p-4 cursor-pointer" onClick={onClick}>
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
            data-cy="openResourceButton"
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
          <NumberFormat
            value={property.price}
            className="text-2xl font-semibold"
          />
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
