'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Page from '@/components/Page';
import { List } from '@/components/ResourceList';
import { RentOverview } from '@/components/rents/RentOverview';
import RentTable from '@/components/rents/RentTable';
import SendByEmailButton from '@/components/rents/SendByEmailButton';
import { useSendEmailDisabledReason } from '@/components/rents/SendEmailGate';
import { useStore } from '@/providers/StoreProvider';
import { fetchRents, QueryKeys } from '@/utils/restcalls';

function _filterData(data, filters) {
  let filteredItems =
    filters['filter.statuses']?.length > 0
      ? data.rents.filter(({ status }) =>
          filters['filter.statuses'].includes(status)
        )
      : data.rents;

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
            manager
              .replace(regExp, '')
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

function Rents() {
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const store = useStore();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');

  const period = useMemo(
    () => (fromParam ? moment(fromParam, 'YYYY-MM-DD') : moment()),
    [fromParam]
  );
  const yearMonth = period.format('YYYY.MM');

  const { data, isError, isLoading } = useQuery({
    queryKey: [QueryKeys.RENTS, yearMonth],
    queryFn: () => fetchRents(store, yearMonth)
  });
  const [rentSelected, setRentSelected] = useState([]);
  const sendEmailDisabledReason = useSendEmailDisabledReason();

  const handleActionDone = useCallback(
    (isEmailSent) => {
      if (!isEmailSent) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RENTS, yearMonth] });
      setRentSelected([]);
    },
    [queryClient, yearMonth]
  );

  const filters = useMemo(
    () => [
      {
        id: 'filter.statuses',
        label: t('Status'),
        values: [
          { id: 'notpaid', label: t('Not paid') },
          { id: 'partiallypaid', label: t('Partially paid') },
          { id: 'paid', label: t('Paid') }
        ]
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
    [t, period]
  );

  const rentOverviewData = useMemo(
    () => ({
      period,
      ...data?.overview
    }),
    [data?.overview, period]
  );

  const renderActions = useMemo(() => {
    const renderActions = () =>
      sendEmailDisabledReason ? null : (
        <SendByEmailButton rents={rentSelected} onDone={handleActionDone} />
      );
    return renderActions;
  }, [handleActionDone, rentSelected, sendEmailDisabledReason]);

  const renderList = useMemo(() => {
    const renderList = ({ data }) => (
      <RentTable
        rents={data}
        selected={rentSelected}
        setSelected={setRentSelected}
        yearMonth={yearMonth}
      />
    );
    return renderList;
  }, [rentSelected, yearMonth]);

  if (isError) {
    toast.error(t('Error fetching rents'));
  }

  return (
    <Page loading={isLoading} dataCy="rentsPage">
      <div className="sm:mb-8">
        <RentOverview data={rentOverviewData} />
      </div>

      <List
        title={t('Rents of {monthYear}', {
          monthYear: period.format('MMMM YYYY')
        })}
        data={data}
        filters={filters}
        filterFn={_filterData}
        renderActions={renderActions}
        renderList={renderList}
      />
    </Page>
  );
}

export default function RentsPage() {
  return <Rents />;
}
