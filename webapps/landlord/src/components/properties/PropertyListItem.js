import { Badge } from '@microrealestate/commonui/components/ui/badge';
import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import NumberFormat from '../../components/NumberFormat';
import PropertyAvatar from './PropertyAvatar';

export default function PropertyListItem({ property }) {
  const router = useRouter();
  const t = useTranslations('common');
  const store = useStore();

  const onClick = useCallback(async () => {
    store.property.setSelected(property);
    await router.push(`/properties/${property._id}`);
  }, [store.property, property, router]);

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
          {t('Rent excluding tax and charges')}
        </div>
        <div className="flex justify-end">
          <NumberFormat
            value={property.price}
            className="text-3xl font-medium border py-2 px-4 rounded bg-body w-3/4"
          />
        </div>
      </CardContent>
      <CardFooter className="p-0 flex-col">
        <div className="flex items-center justify-between w-full py-4 px-6">
          <div className="text-xs text-muted-foreground">
            {property.status !== 'vacant'
              ? t('Occupied by {tenant}', {
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
