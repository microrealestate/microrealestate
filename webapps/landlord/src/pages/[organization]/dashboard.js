import { Box, Hidden } from '@material-ui/core';
import { useComponentMountedRef, useInterval } from '../../utils/hooks';
import { useContext, useMemo, useState } from 'react';

import GeneralFigures from '../../components/dashboard/GeneralFigures';
import MonthFigures from '../../components/dashboard/MonthFigures';
import { observer } from 'mobx-react-lite';
import Page from '../../components/Page';
import Shortcuts from '../../components/dashboard/Shortcuts';
import { StoreContext } from '../../store';
import { useEffect } from 'react';
import Welcome from '../../components/dashboard/Welcome';
import { withAuthentication } from '../../components/Authentication';
import YearFigures from '../../components/dashboard/YearFigures';

const fetchDashboardData = async (store) => {
  const responses = await Promise.all([
    store.dashboard.fetch(),
    store.tenant.fetch(),
    store.lease.fetch(),
  ]);

  return responses.find(({ status }) => status !== 200);
};

const Dashboard = observer(() => {
  console.log('Dashboard functional component');
  const store = useContext(StoreContext);
  const [ready, setReady] = useState(false);
  const mountedRef = useComponentMountedRef();
  const triggerRefreshData = useInterval(
    () => fetchDashboardData(store),
    10000
  );

  useEffect(() => {
    const fetchData = async () => {
      await fetchDashboardData(store);
      if (mountedRef.current) {
        setReady(true);
      }
    };
    fetchData();
  }, [mountedRef, store]);

  useEffect(() => {
    if (mountedRef.current && ready) {
      triggerRefreshData.start();
    }

    return () => triggerRefreshData.clear();
  }, [mountedRef, triggerRefreshData, ready]);

  const isFirstConnection = useMemo(() => {
    return (
      !store.lease?.items?.filter(({ system }) => !system)?.length ||
      !store.dashboard.data.overview?.propertyCount ||
      !store.tenant?.items?.length
    );
  }, [
    store.dashboard.data.overview?.propertyCount,
    store.lease?.items,
    store.tenant?.items?.length,
  ]);

  return (
    <Page loading={!ready}>
      <>
        <Box my={5}>
          <Welcome />
        </Box>
        {isFirstConnection ? (
          <Box mt={10}>
            <Shortcuts firstConnection={true} />
          </Box>
        ) : (
          <>
            <Box mb={10}>
              <Shortcuts />
            </Box>
            <Box my={10}>
              <GeneralFigures />
            </Box>
            <Box my={10}>
              <MonthFigures />
            </Box>
            <Hidden smDown>
              {!!store.dashboard.data.overview && (
                <Box my={10}>
                  <YearFigures />
                </Box>
              )}
            </Hidden>
          </>
        )}
      </>
    </Page>
  );
});

export default withAuthentication(Dashboard);
