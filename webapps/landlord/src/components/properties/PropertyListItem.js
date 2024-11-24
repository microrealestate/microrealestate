import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { useCallback, useContext } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../ui/button';
import NumberFormat from '../../components/NumberFormat';
import PropertyAvatar from './PropertyAvatar';
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
    <Card className="cursor-pointer" onClick={onClick}>
      <CardHeader className="mb-4">
        <CardTitle className="flex justify-start items-center gap-2">
          <PropertyAvatar property={property} />
          <div>
            <Button
              variant="link"
              className="w-fit h-fit p-0 text-xl whitespace-normal"
              data-cy="openResourceButton"
            >
              {property.name}
            </Button>
            <div className="text-xs font-normal text-muted-foreground">
              {property.description}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-right space-y-2 pb-4">
        <div className="text-sm text-muted-foreground">
          {t('Rent excluding tax and expenses')}
        </div>
        <NumberFormat
          value={property.price}
          className="text-3xl font-medium border py-2 px-4 rounded bg-card "
        />
      </CardContent>
      <CardFooter className="p-0 flex-col">
        <div className="flex items-center justify-between w-full py-4 px-6">
          <div className="text-xs text-muted-foreground">
            {property.status !== 'vacant'
              ? t('Occupied by {{tenant}}', {
                  tenant: property.occupantLabel
                })
              : null}
          </div>
          <Badge
            variant={property.status === 'vacant' ? 'success' : 'secondary'}
            className="font-normal"
          >
            {property.status === 'vacant' ? t('Vacant') : t('Rented')}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
