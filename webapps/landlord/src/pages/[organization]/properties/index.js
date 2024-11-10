import { fetchProperties, QueryKeys } from '../../../utils/restcalls';
import { useCallback, useContext, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { List } from '../../../components/ResourceList';
import { LuPlusCircle } from 'react-icons/lu';
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

function _filterData(data = [], filters) {
  let filteredItems = data;
  if (filters.statuses?.length) {
    const typeFilters = filters.statuses.filter(
      (status) => !['vacant', 'occupied'].includes(status)
    );
    if (typeFilters.length) {
      filteredItems = filteredItems.filter(({ type }) =>
        typeFilters.includes(type)
      );
    }

    const statusFilters = filters.statuses.filter((status) =>
      ['vacant', 'occupied'].includes(status)
    );
    if (statusFilters.length) {
      filteredItems = filteredItems.filter(({ status }) =>
        statusFilters.includes(status)
      );
    }
  }

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ name }) =>
        name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) != -1
    );
  }
  return filteredItems;
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

  const handleAction = useCallback(() => {
    setOpenNewPropertyDialog(true);
  }, [setOpenNewPropertyDialog]);

  if (isError) {
    toast.error(t('Error fetching properties'));
  }

  return (
    <Page title={t('Properties')} loading={isLoading} dataCy="propertiesPage">
      <List
        data={data}
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
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={handleAction}
          >
            <LuPlusCircle className="size-4" />
            {t('Add a property')}
          </Button>
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
