'use client';

import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useMultiSelection } from '@/components/MultiSelection';
import Page from '@/components/Page';
import PaginatedList from '@/components/PaginatedList';
import { useRentStatusLabels } from '@/components/rents/RentCells';
import { RentOverview } from '@/components/rents/RentOverview';
import RentTable from '@/components/rents/RentTable';
import {
  DEFAULT_RENT_SORT,
  RENT_STATUSES,
  type RentSort,
  type RentSortKey,
  rentStatus,
  sortRents
} from '@/components/rents/rentView';
import type { MonthRents } from '@/components/rents/types';
import SearchFilterBar, {
  type SearchFilter,
  type SearchSelection,
  selectedValues
} from '@/components/SearchFilterBar';
import { useStore } from '@/providers/StoreProvider';
import { fetchRents, QueryKeys } from '@/utils/restcalls';

type RentFilters = { statuses: string[]; searchText: string };

function _filterData(data: MonthRents | undefined, filters: RentFilters) {
  const rents = data?.rents ?? [];
  let filteredItems =
    filters.statuses.length > 0
      ? rents.filter((rent) => filters.statuses.includes(rentStatus(rent)))
      : rents;

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ occupant: { isCompany, name, manager, contacts }, payments }) => {
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

        // Search match in payment references
        if (!found) {
          found = !!payments?.find(
            ({ reference = '' }) =>
              reference
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) !== -1
          );
        }

        return found;
      }
    );
  }
  return filteredItems;
}

const RENTS_PER_PAGE = 50;

function Rents() {
  const t = useTranslations('common');
  const store = useStore();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');

  const period = useMemo(
    () => (fromParam ? moment(fromParam, 'YYYY-MM-DD') : moment()),
    [fromParam]
  );
  const yearMonth = period.format('YYYY.MM');

  const { data, isError, isLoading } = useQuery<MonthRents>({
    queryKey: [QueryKeys.RENTS, yearMonth],
    queryFn: () => fetchRents(store, yearMonth)
  });
  const selection = useMultiSelection({ alwaysOn: true });
  const [searchFilters, setSearchFilters] = useState<RentFilters>({
    statuses: [],
    searchText: ''
  });
  const [sort, setSort] = useState<RentSort>(DEFAULT_RENT_SORT);

  const [selectionMonth, setSelectionMonth] = useState(yearMonth);
  if (selectionMonth !== yearMonth) {
    setSelectionMonth(yearMonth);
    selection.clear();
  }

  const handleSearch = useCallback(
    (searched: SearchSelection, text: string) => {
      setSearchFilters({
        statuses: selectedValues(searched, 'filter.statuses'),
        searchText: text
      });
    },
    []
  );

  const filteredRents = useMemo(
    () => sortRents(_filterData(data, searchFilters), sort),
    [data, searchFilters, sort]
  );

  const handleSort = useCallback((key: RentSortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 1 ? -1 : 1 }
        : { key, direction: key === 'left' ? -1 : 1 }
    );
  }, []);

  const statusLabels = useRentStatusLabels();
  const monthLabel = period.format('MMMM YYYY');
  const filters = useMemo<SearchFilter[]>(
    () => [
      {
        id: 'filter.statuses',
        label: t('Status'),
        values: RENT_STATUSES.map((id) => ({ id, label: statusLabels[id] }))
      },
      {
        id: 'filter.period',
        type: 'period',
        label: t('Period'),
        timeRange: 'months',
        defaultPeriod: period,
        clearable: false
      }
    ],
    [t, period, statusLabels]
  );

  if (isError) {
    toast.error(t('Error fetching rents'));
  }

  return (
    <Page
      description={t(
        "Follow each tenant's rent for the month, record payments and send payment notices and receipts."
      )}
      dataCy="rentsPage"
      loading={isLoading}
      summary={<RentOverview data={data?.overview} rents={data?.rents} />}
      toolbar={
        <SearchFilterBar
          placeholder={t('Search by tenant, contact or payment reference')}
          filters={filters}
          onSearch={handleSearch}
          className="grow"
        />
      }
      title={t('Rents of {monthYear}', {
        monthYear: monthLabel
      })}
    >
      <PaginatedList items={filteredRents} pageSize={RENTS_PER_PAGE}>
        {(pageRents) => (
          <RentTable
            rents={pageRents}
            filteredRents={filteredRents}
            monthRents={data?.rents}
            selection={selection}
            yearMonth={yearMonth}
            periodLabel={monthLabel}
            sort={sort}
            onSort={handleSort}
          />
        )}
      </PaginatedList>
    </Page>
  );
}

export default function RentsPage() {
  return <Rents />;
}
