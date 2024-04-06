import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs';
import { useCallback, useContext } from 'react';
import { Card } from '../../../components/ui/card';
import { downloadDocument } from '../../../utils/fetch';
import { EmptyIllustration } from '../../../components/Illustrations';
import IncomingTenants from '../../../components/accounting/IncomingTenants';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import OutgoingTenants from '../../../components/accounting/OutgoingTenants';
import Page from '../../../components/Page';
import PeriodPicker from '../../../components/PeriodPicker';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { StoreContext } from '../../../store';
import TenantSettlements from '../../../components/accounting/TenantSettlements';
import useFillStore from '../../../hooks/useFillStore';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

function TopBar({ onSearch }) {
  const store = useContext(StoreContext);
  const router = useRouter();
  const year = router.query.year || moment().year();

  const onChange = useCallback(
    async (period) => {
      await router.push(
        `/${store.organization.selected.name}/accounting/${period.format(
          'YYYY'
        )}`
      );
    },
    [router, store.organization.selected.name]
  );

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 p-2">
      <SearchFilterBar onSearch={onSearch} className="flex-grow" />
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

async function fetchData(store, router) {
  return await store.accounting.fetch(router.query.year);
}

function Accounting() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [fetching] = useFillStore(fetchData, [router]);

  const getSettlementsAsCsv = useCallback(
    async (e) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/settlements/${router.query.year}`,
        documentName: t('Settlements - {{year}}.csv', {
          year: router.query.year
        })
      });
    },
    [t, router.query.year]
  );

  const getIncomingTenantsAsCsv = useCallback(
    async (e) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/tenants/incoming/${router.query.year}`,
        documentName: t('Incoming tenants - {{year}}.csv', {
          year: router.query.year
        })
      });
    },
    [t, router.query.year]
  );

  const getOutgoingTenantsAsCsv = useCallback(
    async (e) => {
      e.stopPropagation();
      downloadDocument({
        endpoint: `/csv/tenants/outgoing/${router.query.year}`,
        documentName: t('Outgoing tenants - {{year}}.csv', {
          year: router.query.year
        })
      });
    },
    [t, router.query.year]
  );

  const getYearInvoices = useCallback(
    (tenant) => () => {
      downloadDocument({
        endpoint: `/documents/invoice/${tenant._id}/${router.query.year}`,
        documentName: `${tenant.name}-${router.query.year}-${t('invoice')}.pdf`
      });
    },
    [router.query.year, t]
  );

  const handleSearch = useCallback(
    (_, searchText) => {
      store.accounting.setSearch(searchText);
    },
    [store.accounting]
  );

  return (
    <Page loading={fetching}>
      <Card className="px-4 py-2 mb-6">
        <TopBar onSearch={handleSearch} />
      </Card>
      {store.accounting.filteredData?.incomingTenants?.length ||
      store.accounting.filteredData?.outgoingTenants?.length ||
      store.accounting.filteredData?.settlements?.length ? (
        <Tabs defaultValue="incoming" className="overflow-x-auto">
          <TabsList className="flex justify-start flex-nowrap w-screen-nomargin-sm overflow-x-auto md:w-full">
            <TabsTrigger value="incoming">{`${t('Incoming tenants')} (${
              store.accounting.filteredData.incomingTenants.length
            })`}</TabsTrigger>
            <TabsTrigger value="outgoing">{`${t('Outgoing tenants')} (${
              store.accounting.filteredData.outgoingTenants.length
            })`}</TabsTrigger>
            <TabsTrigger value="settlements">{`${t('Settlements')} (${
              store.accounting.filteredData.settlements.length
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
              onDownloadYearInvoices={getYearInvoices}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyIllustration label={t('No data found')} />
      )}
    </Page>
  );
}

export default withAuthentication(observer(Accounting));
