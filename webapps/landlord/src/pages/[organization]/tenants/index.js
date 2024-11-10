import { fetchTenants, QueryKeys } from '../../../utils/restcalls';
import React, { useCallback, useContext, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { List } from '../../../components/ResourceList';
import { LuPlusCircle } from 'react-icons/lu';
import NewTenantDialog from '../../../components/tenants/NewTenantDialog';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import TenantList from '../../../components/tenants/TenantList';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function _filterData(data, filters) {
  let filteredItems =
    filters.statuses?.length === 0
      ? data
      : data.filter(({ status }) => filters.statuses.includes(status));

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ isCompany, name, manager, contacts, properties }) => {
        // Search match name
        let found =
          name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
          -1;

        // Search match manager
        if (!found && isCompany) {
          found =
            manager
              ?.replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) != -1;
        }

        // Search match contact
        if (!found) {
          found = !!contacts
            ?.map(({ contact = '', email = '', phone = '' }) => ({
              contact: contact.replace(regExp, '').toLowerCase(),
              email: email.toLowerCase(),
              phone: phone.replace(regExp, '')
            }))
            .filter(
              ({ contact, email, phone }) =>
                contact.indexOf(cleanedSearchText) != -1 ||
                email.indexOf(cleanedSearchText) != -1 ||
                phone.indexOf(cleanedSearchText) != -1
            ).length;
        }

        // Search match property name
        if (!found) {
          found = !!properties?.filter(
            ({ property: { name } }) =>
              name
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) != -1
          ).length;
        }
        return found;
      }
    );
  }
  return filteredItems;
}

function Tenants() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const { isError, data, isLoading } = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store)
  });
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, [setOpenNewTenantDialog]);

  if (isError) {
    toast.error(t('Error fetching tenants'));
  }

  return (
    <Page loading={isLoading} dataCy="tenantsPage">
      <List
        data={data}
        filters={[
          { id: 'inprogress', label: t('Lease running') },
          { id: 'stopped', label: t('Lease ended') }
        ]}
        filterFn={_filterData}
        renderActions={() => (
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={onNewTenant}
          >
            <LuPlusCircle className="size-4" />
            {t('Add a tenant')}
          </Button>
        )}
        renderList={({ data }) => <TenantList tenants={data} />}
      />
      <NewTenantDialog
        open={openNewTenantDialog}
        setOpen={setOpenNewTenantDialog}
      />
    </Page>
  );
}

export default withAuthentication(Tenants);
