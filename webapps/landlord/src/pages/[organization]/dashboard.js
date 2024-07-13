import {
  fetchDashboard,
  fetchLeases,
  fetchTenants,
  QueryKeys
} from '../../utils/restcalls';
import { useContext, useMemo } from 'react';
import GeneralFigures from '../../components/dashboard/GeneralFigures';
import MonthFigures from '../../components/dashboard/MonthFigures';
import Page from '../../components/Page';
import Shortcuts from '../../components/dashboard/Shortcuts';
import { StoreContext } from '../../store';
import { useQuery } from '@tanstack/react-query';
import Welcome from '../../components/Welcome';
import { withAuthentication } from '../../components/Authentication';
import YearFigures from '../../components/dashboard/YearFigures';

function Dashboard() {
  const store = useContext(StoreContext);
  const dashboardQuery = useQuery({
    queryKey: [QueryKeys.DASHBOARD],
    queryFn: () => fetchDashboard(store)
  });
  const tenantsQuery = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store)
  });
  const leasesQuery = useQuery({
    queryKey: [QueryKeys.LEASES],
    queryFn: () => fetchLeases(store)
  });
  const isLoading =
    dashboardQuery.isLoading || tenantsQuery.isLoading || leasesQuery.isLoading;

  const isFirstConnection = useMemo(() => {
    return (
      !leasesQuery?.data?.length ||
      !dashboardQuery?.data?.overview?.propertyCount ||
      !tenantsQuery?.data?.length
    );
  }, [
    dashboardQuery?.data?.overview?.propertyCount,
    leasesQuery?.data?.length,
    tenantsQuery?.data?.length
  ]);

  return (
    <Page loading={isLoading} dataCy="dashboardPage">
      <div className="flex flex-col gap-4">
        <Welcome className="mb-6" />
        {isFirstConnection ? (
          <Shortcuts firstConnection className="w-full" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Shortcuts className="md:col-span-3" />
            <GeneralFigures className="md:col-span-3" />
            <YearFigures className=" md:col-span-3 lg:col-span-2" />
            <MonthFigures className="md:col-span-3 lg:col-span-1" />
          </div>
        )}
      </div>
    </Page>
  );
}

export default withAuthentication(Dashboard);
