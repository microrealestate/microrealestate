import { fetchProperties, QueryKeys } from '../../../utils/restcalls';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { List } from '../../../components/ResourceList';
import {
  LuBuilding2,
  LuDollarSign,
  LuPlusCircle,
  LuWrench
} from 'react-icons/lu';
import NewPropertyDialog from '../../../components/properties/NewPropertyDialog';
import Page from '../../../components/Page';
import PropertyList from '../../../components/properties/PropertyList';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import types from '../../../components/properties/types';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function CityRentRatesIcon() {
  return (
    <span className="relative inline-flex items-center justify-center size-4">
      <LuBuilding2 className="size-full" />
      <LuDollarSign className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-background text-emerald-600" />
    </span>
  );
}

function _groupPropertiesByHierarchy(data = []) {
  // Create a map of all properties by ID for quick lookup
  const propertyMap = data.reduce((acc, property) => {
    acc[property._id] = property;
    return acc;
  }, {});

  // Identify parent IDs (all unique parentPropertyId values)
  const parentIds = new Set();
  data.forEach((property) => {
    if (property.parentPropertyId) {
      const parentId =
        typeof property.parentPropertyId === 'object' &&
        property.parentPropertyId._id
          ? property.parentPropertyId._id
          : property.parentPropertyId;
      parentIds.add(parentId);
    }
  });

  // Create a map of children by parent ID
  const childrenByParent = data.reduce((acc, property) => {
    if (property.parentPropertyId) {
      const parentId =
        typeof property.parentPropertyId === 'object' &&
        property.parentPropertyId._id
          ? property.parentPropertyId._id
          : property.parentPropertyId;

      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(property);
    }
    return acc;
  }, {});

  // Separate properties into groups:
  // 1. Parent properties with their children (as a single group)
  // 2. Standalone properties (no parent, no children)
  const parentProperties = data.filter((p) => parentIds.has(p._id));
  const standaloneProperties = data.filter(
    (p) => !parentIds.has(p._id) && !p.parentPropertyId
  );

  // Create groups where each parent + its children = one group
  const groups = parentProperties.map((parentProperty) => ({
    type: 'parent-group',
    parent: parentProperty,
    children: childrenByParent[parentProperty._id] || []
  }));

  // Add standalone properties as individual groups
  standaloneProperties.forEach((property) => {
    groups.push({
      type: 'standalone',
      parent: property,
      children: []
    });
  });

  return groups;
}

function _filterGroups(groups = [], filters) {
  let filteredGroups = groups;
  
  // Filter by status and type
  if (filters.statuses?.length) {
    const typeFilters = filters.statuses.filter(
      (status) => !['vacant', 'occupied'].includes(status)
    );
    const statusFilters = filters.statuses.filter((status) =>
      ['vacant', 'occupied'].includes(status)
    );

    filteredGroups = filteredGroups.filter((group) => {
      const parent = group.parent;
      
      // Check type filter
      if (typeFilters.length && !typeFilters.includes(parent.type)) {
        return false;
      }

      // Check status filter
      if (statusFilters.length && !statusFilters.includes(parent.status)) {
        return false;
      }

      return true;
    });
  }

  // Filter by search text
  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredGroups = filteredGroups.filter(({ parent }) =>
      parent.name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
      -1
    );
  }

  return filteredGroups;
}

function _filterData(data = [], filters) {
  return _filterGroups(data, filters);
}

function Properties() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store)
  });

  const [openNewPropertyDialog, setOpenNewPropertyDialog] = useState(false);
  const [pageSize, setPageSize] = useState(5);

  // Group properties into hierarchy groups (parent + children as units)
  const groupedData = useMemo(
    () => (data ? _groupPropertiesByHierarchy(data) : []),
    [data]
  );

  const handleAction = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, [setOpenNewPropertyDialog]);

  if (isError) {
    toast.error(t('Error fetching properties'));
  }

  return (
    <Page title={t('Properties')} loading={isLoading} dataCy="propertiesPage">
      <List
        data={groupedData}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        filters={[
          { id: 'vacant', label: t('Vacant') },
          { id: 'occupied', label: t('Rented') },
          ...types.map(({ id, labelId }) => ({
            id,
            label: t(labelId)
          }))
        ]}
        actions={[{ id: 'addProperty', label: t('Add a property') }]}
        filterFn={_filterData}
        renderActions={() => (
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={handleAction}
            >
              <LuPlusCircle className="size-4" />
              {t('Add a property')}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                router.push(`/${store.organization.selected.name}/utilities`)
              }
            >
              <LuWrench className="size-4" />
              {t('Utilities')}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                router.push(
                  `/${store.organization.selected.name}/properties/rent-estimates`
                )
              }
            >
              <CityRentRatesIcon />
              {t('City rent estimates')}
            </Button>
          </div>
        )}
        renderList={PropertyList}
      />
      <NewPropertyDialog
        open={openNewPropertyDialog}
        setOpen={setOpenNewPropertyDialog}
      />
    </Page>
  );
}

export default withAuthentication(Properties);
