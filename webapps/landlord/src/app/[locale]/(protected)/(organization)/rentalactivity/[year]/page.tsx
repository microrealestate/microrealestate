'use client';

import { toast } from '@microrealestate/commonui/components/ui/sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@microrealestate/commonui/components/ui/tabs';
import type { API } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment, { type Moment } from 'moment';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type MouseEvent, useCallback } from 'react';
import Page from '@/components/Page';
import PeriodPicker from '@/components/PeriodPicker';
import IncomingTenants from '@/components/rentalactivity/IncomingTenants';
import OutgoingTenants from '@/components/rentalactivity/OutgoingTenants';
import TenantSettlements from '@/components/rentalactivity/TenantSettlements';
import SearchFilterBar, {
  type SearchSelection
} from '@/components/SearchFilterBar';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import type Store from '@/store/Store';
import { downloadDocument } from '@/utils/fetch';
import { fetchRentalActivities, QueryKeys } from '@/utils/restcalls';

type RentalActivityParams = { year: string };

function rentalActivity(store: Store) {
  return store.accounting
    .filteredData as Partial<API.Landlord.Accounting.GetAccounting.ResponseBody>;
}

function TopBar({
  onSearch
}: {
  onSearch: (selection: SearchSelection, searchText: string) => void;
}) {
  const t = useTranslations('common');
  const router = useRouter();
  const params = useParams<RentalActivityParams>();
  const year = params.year || moment().year();

  const onChange = useCallback(
    async (period: Moment) => {
      router.push(`/rentalactivity/${period.format('YYYY')}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      <SearchFilterBar
        placeholder={t('Search by tenant name')}
        onSearch={onSearch}
        className="grow"
      />
      <PeriodPicker
        period="year"
        value={moment(year, 'YYYY')}
        onChange={onChange}
        className="text-2xl gap-4"
      />
    </div>
  );
}

function RentalActivity() {
  const t = useTranslations('common');
  const params = useParams<RentalActivityParams>();
  const store = useStore();
  const { isLoading } = useQuery({
    queryKey: [QueryKeys.RENTAL_ACTIVITIES, params.year],
    queryFn: () => fetchRentalActivities(store, params.year)
  });

  const getSettlementsAsCsv = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/settlements/${params.year}`,
        documentName: t('Payments - {year}.csv', {
          year: params.year
        })
      }).catch((_error) => {
        toast.error(t('Cannot download document'));
      });
    },
    [t, params.year]
  );

  const getIncomingTenantsAsCsv = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/tenants/incoming/${params.year}`,
        documentName: t('Incoming tenants - {year}.csv', {
          year: params.year
        })
      }).catch((_error) => {
        toast.error(t('Cannot download document'));
      });
    },
    [t, params.year]
  );

  const getOutgoingTenantsAsCsv = useCallback(
    async (e: MouseEvent) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/tenants/outgoing/${params.year}`,
        documentName: t('Outgoing tenants - {year}.csv', {
          year: params.year
        })
      }).catch((_error) => {
        toast.error(t('Cannot download document'));
      });
    },
    [t, params.year]
  );

  const getYearReceipts = useCallback(
    (tenant: { _id: string; name: string }) => () => {
      downloadDocument({
        endpoint: `/documents/receipt/${tenant._id}/${params.year}`,
        documentName: `${tenant.name}-${params.year}-${t('receipt')}.pdf`
      }).catch((_error) => {
        toast.error(t('Cannot download document'));
      });
    },
    [params.year, t]
  );

  const handleSearch = useCallback(
    (_: SearchSelection, searchText: string) => {
      store.accounting.setSearch(searchText);
    },
    [store.accounting]
  );

  return (
    <Page
      description={t(
        'Rent collected over the year, incoming and outgoing tenants, and end-of-lease settlements.'
      )}
      title={t('Rental activity')}
      toolbar={<TopBar onSearch={handleSearch} />}
      loading={isLoading}
      dataCy="rentalActivityPage"
    >
      <Tabs defaultValue="incoming">
        <TabsList className="flex items-start justify-start h-auto w-full overflow-x-auto">
          <TabsTrigger value="incoming" className="min-w-48 shrink-0">{`${t(
            'Incoming tenants'
          )} (${
            rentalActivity(store).incomingTenants?.length || 0
          })`}</TabsTrigger>
          <TabsTrigger value="outgoing" className="min-w-48 shrink-0">{`${t(
            'Outgoing tenants'
          )} (${
            rentalActivity(store).outgoingTenants?.length || 0
          })`}</TabsTrigger>
          <TabsTrigger value="settlements" className="min-w-48 shrink-0">{`${t(
            'Payments'
          )} (${rentalActivity(store).settlements?.length || 0})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming">
          <IncomingTenants onCSVClick={getIncomingTenantsAsCsv} />
        </TabsContent>
        <TabsContent value="outgoing">
          <OutgoingTenants onCSVClick={getOutgoingTenantsAsCsv} />
        </TabsContent>
        <TabsContent value="settlements">
          <TenantSettlements
            onCSVClick={getSettlementsAsCsv}
            onDownloadYearReceipts={getYearReceipts}
          />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

const RentalActivityPage = observer(function () {
  return <RentalActivity />;
});
export default RentalActivityPage;
