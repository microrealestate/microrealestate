import {
  fetchDashboard,
  fetchLeases,
  fetchProperties,
  fetchTenants,
  QueryKeys
} from '../../utils/restcalls';
import GeneralFigures from '../../components/dashboard/GeneralFigures';
import MonthFigures from '../../components/dashboard/MonthFigures';
import Page from '../../components/Page';
import Shortcuts from '../../components/dashboard/Shortcuts';
import { StoreContext } from '../../store';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import Welcome from '../../components/Welcome';
import { withAuthentication } from '../../components/Authentication';
import YearFigures from '../../components/dashboard/YearFigures';

function Dashboard() {
  const store = useContext(StoreContext);
  const dashboardQuery = useQuery({
    queryKey: [QueryKeys.DASHBOARD],
    queryFn: () => fetchDashboard(store),
    refetchOnMount: 'always',
    retry: 3
  });
  const tenantsQuery = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store),
    refetchOnMount: 'always',
    retry: 3
  });
  const propertiesQuery = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store),
    refetchOnMount: 'always',
    retry: 3
  });
  const leasesQuery = useQuery({
    queryKey: [QueryKeys.LEASES],
    queryFn: () => fetchLeases(store),
    refetchOnMount: 'always',
    retry: 3
  });
  const isLoading =
    dashboardQuery.isLoading ||
    tenantsQuery.isLoading ||
    propertiesQuery.isLoading ||
    leasesQuery.isLoading;
  const isFirstConnection =
    !leasesQuery?.data?.length ||
    !dashboardQuery?.data?.overview?.propertyCount ||
    !tenantsQuery?.data?.length ||
    !propertiesQuery?.data?.length;

  return (
    <Page loading={isLoading} dataCy="dashboardPage">
      <div className="flex flex-col gap-4">
        <Welcome className="mb-6" />
        {isFirstConnection ? (
          <Shortcuts firstConnection className="w-full" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Shortcuts className="md:col-span-5" />
            <MonthFigures className="md:col-span-3" />
            <GeneralFigures className="md:col-span-2" />
            <YearFigures className="md:col-span-5" />
          </div>
        )}
      </div>
    </Page>
  );
}

export default withAuthentication(Dashboard);
