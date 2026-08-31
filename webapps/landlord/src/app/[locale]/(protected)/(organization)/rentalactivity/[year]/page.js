'use client';

import { Card } from '@microrealestate/commonui/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@microrealestate/commonui/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';
import Page from '@/components/Page';
import PeriodPicker from '@/components/PeriodPicker';
import IncomingTenants from '@/components/rentalactivity/IncomingTenants';
import OutgoingTenants from '@/components/rentalactivity/OutgoingTenants';
import TenantSettlements from '@/components/rentalactivity/TenantSettlements';
import SearchFilterBar from '@/components/SearchFilterBar';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { downloadDocument } from '@/utils/fetch';
import { fetchRentalActivities, QueryKeys } from '@/utils/restcalls';

function TopBar({ onSearch }) {
  const router = useRouter();
  const params = useParams();
  const year = params.year || moment().year();

  const onChange = useCallback(
    async (period) => {
      router.push(`/rentalactivity/${period.format('YYYY')}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 p-2">
      <SearchFilterBar onSearch={onSearch} className="grow" />
      <PeriodPicker
        format="YYYY"
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
  const params = useParams();
  const store = useStore();
  const { isLoading } = useQuery({
    queryKey: [QueryKeys.RENTAL_ACTIVITIES, params.year],
    queryFn: () => fetchRentalActivities(store, params.year)
  });

  const getSettlementsAsCsv = useCallback(
    async (e) => {
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
    async (e) => {
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
    async (e) => {
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
    (tenant) => () => {
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
    (_, searchText) => {
      store.accounting.setSearch(searchText);
    },
    [store.accounting]
  );

  return (
    <Page loading={isLoading} dataCy="rentalActivityPage">
      <Card className="px-4 py-2 mb-6">
        <TopBar onSearch={handleSearch} />
      </Card>
      <Tabs defaultValue="incoming">
        <TabsList className="flex items-start justify-start h-auto w-full overflow-x-auto">
          <TabsTrigger value="incoming" className="min-w-48 shrink-0">{`${t(
            'Incoming tenants'
          )} (${
            store.accounting.filteredData.incomingTenants?.length || 0
          })`}</TabsTrigger>
          <TabsTrigger value="outgoing" className="min-w-48 shrink-0">{`${t(
            'Outgoing tenants'
          )} (${
            store.accounting.filteredData.outgoingTenants?.length || 0
          })`}</TabsTrigger>
          <TabsTrigger value="settlements" className="min-w-48 shrink-0">{`${t(
            'Payments'
          )} (${
            store.accounting.filteredData.settlements?.length || 0
          })`}</TabsTrigger>
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
