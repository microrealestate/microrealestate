'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { toast } from 'sonner';
import Page from '@/components/Page';
import { List } from '@/components/ResourceList';
import NewTenantDialog from '@/components/tenants/NewTenantDialog';
import TenantList from '@/components/tenants/TenantList';
import { useStore } from '@/providers/StoreProvider';
import { fetchTenants, QueryKeys } from '@/utils/restcalls';

function _filterData(data, filters) {
  let filteredItems = filters['filter.statuses']?.length
    ? data.filter(({ status }) => filters['filter.statuses'].includes(status))
    : data;

  if (filters['filter.leases']?.length) {
    filteredItems = filteredItems.filter(({ lease }) =>
      filters['filter.leases'].includes(DOMPurify.sanitize(lease?.name))
    );
  }

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ isCompany, name, manager, contacts, properties }) => {
        // Search match name
        let found =
          name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !==
          -1;

        // Search match manager
        if (!found && isCompany) {
          found =
            manager
              ?.replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) !== -1;
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
                contact.indexOf(cleanedSearchText) !== -1 ||
                email.indexOf(cleanedSearchText) !== -1 ||
                phone.indexOf(cleanedSearchText) !== -1
            ).length;
        }

        // Search match property name
        if (!found) {
          found = !!properties?.filter(
            ({ property: { name } }) =>
              name
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) !== -1
          ).length;
        }
        return found;
      }
    );
  }
  return filteredItems;
}

function Tenants() {
  const t = useTranslations('common');
  const store = useStore();
  const { isError, data, isLoading } = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store)
  });
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  });

  const filters = useMemo(() => {
    const leaseSet = new Set();
    data?.forEach((tenant) => {
      if (tenant?.lease) {
        leaseSet.add(tenant.lease.name);
      }
    });
    const leases = [...leaseSet].map((lease) => ({
      id: DOMPurify.sanitize(lease),
      label: lease
    }));

    const statuses = [
      { id: 'inprogress', label: t('Lease running'), isDefault: true },
      { id: 'stopped', label: t('Lease ended') }
    ];

    return [
      {
        id: 'filter.leases',
        label: t('Lease'),
        values: leases
      },
      {
        id: 'filter.statuses',
        label: t('Status'),
        isDefault: true,
        values: statuses
      }
    ];
  }, [data, t]);

  const renderActions = useMemo(() => {
    const renderActions = () => (
      <Button variant="outline" className="w-full gap-2" onClick={onNewTenant}>
        <LuCirclePlus className="size-4" />
        {t('Add a tenant')}
      </Button>
    );
    return renderActions;
  }, [onNewTenant, t]);

  const renderList = useMemo(() => {
    const renderList = ({ data }) => <TenantList tenants={data} />;
    return renderList;
  }, []);

  if (isError) {
    toast.error(t('Error fetching tenants'));
  }

  return (
    <Page loading={isLoading} dataCy="tenantsPage">
      <List
        data={data}
        filters={filters}
        filterFn={_filterData}
        renderActions={renderActions}
        renderList={renderList}
      />
      <NewTenantDialog
        open={openNewTenantDialog}
        setOpen={setOpenNewTenantDialog}
      />
    </Page>
  );
}

export default function TenantsPage() {
  return <Tenants />;
}
