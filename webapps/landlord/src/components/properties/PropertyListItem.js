import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { useCallback, useContext, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../ui/button';
import NumberFormat from '../../components/NumberFormat';
import PropertyAvatar from './PropertyAvatar';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';

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
                className="p-1 hover:bg-gray-100 rounded transition-colors"
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
                className="w-fit h-fit p-0 text-xl whitespace-normal"
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
        <CardContent className="text-right space-y-2 pb-4">
          <div className="text-sm text-muted-foreground">
            {isParent
              ? t('Total rent from units')
              : t('Rent excluding tax and expenses')}
          </div>
          <NumberFormat
            value={rentDisplayValue}
            className="text-3xl font-medium border py-2 px-4 rounded bg-card"
          />
        </CardContent>
        <CardFooter className="p-0 flex-col">
          <div className="flex items-center justify-between w-full py-4 px-6">
            <div className="text-xs text-muted-foreground">
              {!isParent && property.status !== 'vacant'
                ? t('Occupied by {{tenant}}', {
                    tenant: property.occupantLabel
                  })
                : isParent
                  ? t('Building with units')
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

      {/* Expanded child properties */}
      {isParent && isExpanded && childProperties.length > 0 && (
        <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-200 pl-4 py-3">
          {childProperties.map((child) => (
            <div key={child._id} className="bg-gray-50 rounded-lg p-3">
              <PropertyListItem
                property={child}
                childProperties={[]}
                isChild={true}
                onPropertyClick={onPropertyClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
