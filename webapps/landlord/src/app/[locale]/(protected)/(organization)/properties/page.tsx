'use client';

import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { LuCirclePlus, LuSquareCheck } from 'react-icons/lu';
import {
  MultiSelectionProvider,
  useMultiSelection
} from '@/components/MultiSelection';
import Page from '@/components/Page';
import PropertyThresholdAlert from '@/components/PropertyThresholdAlert';
import {
  canMove,
  displayStatus,
  type Unit
} from '@/components/properties/composition';
import NewPropertyDialog from '@/components/properties/NewPropertyDialog';
import PropertyMoveBar from '@/components/properties/PropertyMoveBar';
import PropertyStackingPlan from '@/components/properties/PropertyStackingPlan';
import types from '@/components/properties/types';
import SearchFilterBar, {
  type SearchSelection,
  selectedValues
} from '@/components/SearchFilterBar';
import { useStore } from '@/providers/StoreProvider';
import { fetchProperties, QueryKeys } from '@/utils/restcalls';

type PropertyFilters = {
  statuses: string[];
  kinds: string[];
  searchText: string;
};

function _filterData(data: Unit[] = [], filters: PropertyFilters) {
  let filteredItems = filters.statuses.length
    ? data.filter((property) =>
        filters.statuses.includes(displayStatus(property) ?? '')
      )
    : data;

  if (filters.kinds.length) {
    filteredItems = filteredItems.filter(({ type }) =>
      filters.kinds.includes(type ?? '')
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
  const { data, isError, isLoading } = useQuery<Unit[]>({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store)
  });
  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const selection = useMultiSelection();
  const [searchFilters, setSearchFilters] = useState<PropertyFilters | null>(
    null
  );
  const handleSearch = useCallback(
    (searched: SearchSelection, text: string) => {
      setSearchFilters({
        statuses: selectedValues(searched, 'filter.statuses'),
        kinds: selectedValues(searched, 'filter.properties'),
        searchText: text
      });
    },
    []
  );
  const planMatches = useMemo(() => {
    if (!data || !searchFilters) {
      return undefined;
    }
    const matching = _filterData(data, searchFilters);
    return matching.length === data.length
      ? undefined
      : new Set(matching.map(({ _id }) => _id));
  }, [data, searchFilters]);

  const selectableIds = useMemo(
    () =>
      (data ?? [])
        .filter(({ _id }) => !planMatches || planMatches.has(_id))
        .map(({ _id }) => _id),
    [data, planMatches]
  );

  const movable = useMemo(() => {
    const units = data ?? [];
    return units.some((unit) => canMove(unit, units));
  }, [data]);

  const handleAction = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, []);

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
        values: [
          { id: 'vacant', label: t('Vacant') },
          { id: 'occupied', label: t('Occupied') }
        ]
      }
    ],
    [t]
  );

  const actions = useMemo(
    () => [
      {
        id: 'moveProperties',
        label: t('Move'),
        icon: LuSquareCheck,
        onClick: selection.start,
        hidden: !movable,
        dataCy: 'toggleMoveProperties'
      },
      {
        id: 'addProperty',
        label: t('New property'),
        icon: LuCirclePlus,
        onClick: handleAction,
        primary: true,
        dataCy: 'addProperty'
      }
    ],
    [handleAction, selection.start, movable, t]
  );

  const moveBar = selection.selecting ? (
    <PropertyMoveBar
      units={data ?? []}
      selected={selection.selected}
      selectableIds={selectableIds}
      onSelectAll={() => selection.setAll(selectableIds)}
      onDone={selection.stop}
      onCancel={selection.stop}
    />
  ) : null;

  if (isError) {
    toast.error(t('Error fetching properties'));
  }

  return (
    <Page
      description={t(
        'Your rental properties and whether each one is let or vacant.'
      )}
      title={t('Properties')}
      actions={selection.selecting ? [] : actions}
      loading={isLoading}
      dataCy="propertiesPage"
      intro={<PropertyThresholdAlert />}
      toolbar={
        <SearchFilterBar
          placeholder={t('Search by property name')}
          filters={filters}
          onSearch={handleSearch}
          className="grow"
        />
      }
    >
      <MultiSelectionProvider value={selection}>
        <PropertyStackingPlan data={data} matches={planMatches} />
        {moveBar}
      </MultiSelectionProvider>
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
