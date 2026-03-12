import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';
import { useCallback, useContext, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../ui/button';
import NumberFormat from '../../components/NumberFormat';
import PropertyAvatar from './PropertyAvatar';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

export default function PropertyListItem({
  property,
  childProperties = [],
  isChild = false,
  onPropertyClick
}) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total rent from all child properties
  const totalRent = childProperties.reduce((sum, child) => {
    return sum + (child.price || 0);
  }, 0);

  // Calculate rented and unrented child properties
  const rentedCount = childProperties.filter(
    (child) => child.status !== 'vacant'
  ).length;
  const unrentedCount = childProperties.length - rentedCount;

  // Check if this property is a parent (has children)
  const isParent = childProperties.length > 0;

  const onClick = useCallback(
    async (e) => {
      // Don't navigate if clicking the expand button
      if (e?.target?.closest('[data-expand-button]')) {
        return;
      }
      store.property.setSelected(property);
      store.appHistory.setPreviousPath(router.asPath);
      await router.push(
        `/${store.organization.selected.name}/properties/${property._id}`
      );
    },
    [
      store.property,
      store.appHistory,
      store.organization.selected.name,
      property,
      router
    ]
  );

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Display rent value: for parent properties, show total from children; for child/standalone, show own rent
  const rentDisplayValue = isParent ? totalRent : property.price;

  return (
    <div>
      <Card
        className={`cursor-pointer transition-all ${isChild ? 'border-l-4 border-l-blue-200' : ''}`}
        onClick={onClick}
      >
        <CardHeader className="mb-4">
          <CardTitle className="flex justify-start items-center gap-2">
            {isParent && (
              <button
                data-expand-button
                onClick={handleExpandClick}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label={isExpanded ? t('Collapse') : t('Expand')}
              >
                {isExpanded ? (
                  <LuChevronDown className="size-5" />
                ) : (
                  <LuChevronRight className="size-5" />
                )}
              </button>
            )}
            <PropertyAvatar property={property} />
            <div className="flex-1">
              <Button
                variant="link"
                className="w-fit h-fit p-0 text-xl whitespace-normal hover:bg-muted rounded transition-colors"
                data-cy="openResourceButton"
              >
                {property.name}
                {isParent && (
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    ({childProperties.length}{' '}
                    {childProperties.length === 1 ? t('unit') : t('units')})
                  </span>
                )}
              </Button>
              <div className="text-xs font-normal text-muted-foreground">
                {property.description}
              </div>
              {isParent && (
                <div className="text-xs text-blue-600 mt-1">
                  {t('Parent property')}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        {!isParent && (
          <CardContent className="text-right space-y-2 pb-4">
            <div className="text-sm text-muted-foreground">
              {t('Rent excluding tax and expenses')}
            </div>
            <NumberFormat
              value={rentDisplayValue}
              className="text-3xl font-medium border py-2 px-4 rounded bg-card"
            />
          </CardContent>
        )}
        <CardFooter className="p-0 flex-col">
          <div className="flex items-center justify-between w-full py-4 px-6">
            <div className="text-xs text-muted-foreground">
              {!isParent && property.status !== 'vacant'
                ? t('Occupied by {{tenant}}', {
                    tenant: property.occupantLabel
                  })
                : isParent
                  ? `${rentedCount} ${t('rented')}, ${unrentedCount} ${t('vacant')}`
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

      {/* Expanded child properties - compact list with thumbnails */}
      {isParent && isExpanded && childProperties.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 px-6">
            Sub Properties
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6 pb-4">
            {childProperties.map((child) => (
              <SubPropertyCard
                key={child._id}
                property={child}
                t={t}
                router={router}
                store={store}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact card component for sub-properties
function SubPropertyCard({ property, t, router, store }) {
  const onClick = useCallback(
    async (e) => {
      e.stopPropagation();
      store.property.setSelected(property);
      store.appHistory.setPreviousPath(router.asPath);
      await router.push(
        `/${store.organization.selected.name}/properties/${property._id}`
      );
    },
    [
      store.property,
      store.appHistory,
      store.organization.selected.name,
      property,
      router
    ]
  );

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border border-input overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
    >
      {/* Thumbnail */}
      <div className="h-20 bg-muted flex items-center justify-center overflow-hidden border-b border-input">
        <PropertyAvatar property={property} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-2">
        <h5 className="text-xs font-semibold leading-tight mb-1 line-clamp-2">
          {property.name}
        </h5>
        <div className="text-xs text-muted-foreground mb-2 flex-1">
          {property.description && (
            <p className="line-clamp-1">{property.description}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-input p-2 space-y-1">
        <div className="text-xs text-muted-foreground">{t('Rent')}</div>
        <NumberFormat
          value={property.price || 0}
          className="text-sm font-semibold"
        />
        <Badge
          variant={property.status === 'vacant' ? 'success' : 'secondary'}
          className="text-xs font-normal w-full justify-center"
        >
          {property.status === 'vacant' ? t('Vacant') : t('Rented')}
        </Badge>
      </div>
    </div>
  );
}
