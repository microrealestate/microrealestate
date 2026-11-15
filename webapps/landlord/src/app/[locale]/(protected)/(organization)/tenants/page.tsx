'use client';

import { toast } from '@microrealestate/commonui/components/ui/sonner';
import type { API } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import Page from '@/components/Page';
import PaginatedList from '@/components/PaginatedList';
import SearchFilterBar, {
  type FilterValue,
  type SearchFilter,
  type SearchSelection,
  selectedValues
} from '@/components/SearchFilterBar';
import NewTenantDialog from '@/components/tenants/NewTenantDialog';
import TenantList from '@/components/tenants/TenantList';
import { useStore } from '@/providers/StoreProvider';
import { fetchTenants, QueryKeys } from '@/utils/restcalls';

type TenantFilters = {
  statuses: string[];
  leases: string[];
  searchText: string;
};

function _filterData(
  data: API.Landlord.Tenant.OccupantData[] = [],
  filters: TenantFilters
) {
  let filteredItems = filters.statuses.length
    ? data.filter(({ status }) => filters.statuses.includes(status))
    : data;

  if (filters.leases.length) {
    filteredItems = filteredItems.filter(({ lease }) =>
      filters.leases.includes(DOMPurify.sanitize(lease?.name ?? ''))
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
            (manager ?? '')
              .replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) !== -1;
        }

        // Search match contact
        if (!found) {
          found = !!contacts
            ?.map(({ name: contact = '', email = '', phone1: phone = '' }) => ({
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
  const { isError, data, isLoading } = useQuery<
    API.Landlord.Tenant.OccupantData[]
  >({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store)
  });
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);
  const [searchFilters, setSearchFilters] = useState<TenantFilters>({
    statuses: [],
    leases: [],
    searchText: ''
  });
  const handleSearch = useCallback(
    (searched: SearchSelection, text: string) => {
      setSearchFilters({
        statuses: selectedValues(searched, 'filter.statuses'),
        leases: selectedValues(searched, 'filter.leases'),
        searchText: text
      });
    },
    []
  );

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, []);

  const filters = useMemo<SearchFilter[]>(() => {
    const leaseSet = new Set<string>();
    data?.forEach((tenant) => {
      if (tenant?.lease) {
        leaseSet.add(tenant.lease.name);
      }
    });
    const leases = [...leaseSet].map((lease) => ({
      id: DOMPurify.sanitize(lease),
      label: lease
    }));

    const statuses: FilterValue[] = [
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

  const actions = useMemo(
    () => [
      {
        id: 'addTenant',
        label: t('Add a tenant'),
        icon: LuCirclePlus,
        onClick: onNewTenant
      }
    ],
    [onNewTenant, t]
  );

  const filteredTenants = useMemo(
    () => _filterData(data, searchFilters),
    [data, searchFilters]
  );

  if (isError) {
    toast.error(t('Error fetching tenants'));
  }

  return (
    <Page
      description={t('Your tenants and the lease each of them signed.')}
      title={t('Tenants')}
      actions={actions}
      loading={isLoading}
      dataCy="tenantsPage"
      toolbar={
        <SearchFilterBar
          placeholder={t('Search by tenant, contact or property')}
          filters={filters}
          onSearch={handleSearch}
          className="grow"
        />
      }
    >
      <PaginatedList items={filteredTenants}>
        {(pageTenants) => <TenantList tenants={pageTenants} />}
      </PaginatedList>
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
