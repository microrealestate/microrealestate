'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { cn } from '@microrealestate/commonui/utils';
import { PROPERTY_COUNT_WARN_THRESHOLD } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { LuCirclePlus, LuTriangleAlert } from 'react-icons/lu';
import { toast } from 'sonner';
import Page from '@/components/Page';
import PropertyThresholdNotice from '@/components/PropertyThresholdNotice';
import NewPropertyDialog from '@/components/properties/NewPropertyDialog';
import PropertyList from '@/components/properties/PropertyList';
import types from '@/components/properties/types';
import { List } from '@/components/ResourceList';
import { useStore } from '@/providers/StoreProvider';
import { fetchProperties, QueryKeys } from '@/utils/restcalls';

function _filterData(data = [], filters) {
  let filteredItems = filters['filter.statuses']?.length
    ? data.filter(({ status }) => filters['filter.statuses'].includes(status))
    : data;

  if (filters['filter.properties']?.length) {
    filteredItems = filteredItems.filter(({ type }) =>
      filters['filter.properties'].includes(type)
    );
  }

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ name }) =>
        name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !== -1
    );
  }
  return filteredItems;
}

function Properties() {
  const t = useTranslations('common');
  const store = useStore();
  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store)
  });

  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);

  const handleAction = useCallback(() => {
    setOpenNewPropertyDialog(true);
  });

  const filters = useMemo(
    () => [
      {
        id: 'filter.properties',
        label: t('Property'),
        values: [
          ...types.map(({ id, labelId }) => ({
            id,
            label: t(labelId)
          }))
        ]
      },
      {
        id: 'filter.statuses',
        label: t('Status'),
        isDefault: true,
        values: [
          { id: 'vacant', label: t('Vacant'), isDefault: true },
          { id: 'occupied', label: t('Rented') }
        ]
      }
    ],
    [t]
  );

  const propertyCount = data?.length ?? 0;
  const overThreshold = propertyCount > PROPERTY_COUNT_WARN_THRESHOLD;

  const renderActions = useMemo(() => {
    const renderActions = () => (
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleAction}
          data-cy="addPropertyButton"
        >
          <LuCirclePlus className="size-4" />
          {t('Add a property')}
        </Button>
        <span
          className={cn(
            'text-xs flex items-center justify-center md:justify-end gap-1',
            overThreshold ? 'text-warning' : 'text-muted-foreground'
          )}
          data-cy="propertyCountCaption"
        >
          {overThreshold ? <LuTriangleAlert className="size-3.5" /> : null}
          {t('{used} of {max} properties', {
            used: propertyCount,
            max: PROPERTY_COUNT_WARN_THRESHOLD
          })}
        </span>
      </div>
    );
    return renderActions;
  }, [handleAction, t, propertyCount, overThreshold]);

  const renderNotice = useMemo(
    () => (overThreshold ? () => <PropertyThresholdNotice /> : undefined),
    [overThreshold]
  );

  if (isError) {
    toast.error(t('Error fetching properties'));
  }

  return (
    <Page title={t('Properties')} loading={isLoading} dataCy="propertiesPage">
      <List
        data={data}
        filters={filters}
        filterFn={_filterData}
        renderActions={renderActions}
        renderNotice={renderNotice}
        renderList={PropertyList}
      />
      <NewPropertyDialog
        open={openNewPropertyDialog}
        setOpen={setOpenNewPropertyDialog}
      />
    </Page>
  );
}

export default function PropertiesPage() {
  return <Properties />;
}
