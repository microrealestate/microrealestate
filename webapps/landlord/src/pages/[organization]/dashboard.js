import { Box, Hidden } from '@material-ui/core';
import { useContext, useMemo, useState } from 'react';

import GeneralFigures from '../../components/dashboard/GeneralFigures';
import MonthFigures from '../../components/dashboard/MonthFigures';
import { observer } from 'mobx-react-lite';
import Page from '../../components/Page';
import Shortcuts from '../../components/dashboard/Shortcuts';
import { StoreContext } from '../../store';
import { useComponentMountedRef } from '../../utils/hooks';
import { useEffect } from 'react';
import Welcome from '../../components/Welcome';
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

  useEffect(() => {
    const fetchData = async () => {
      await fetchDashboardData(store);
      if (mountedRef.current) {
        setReady(true);
      }
    };
    fetchData();
  }, [mountedRef, store]);

  const isFirstConnection = useMemo(() => {
    return (
      !store.lease?.items?.length ||
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
          <Box mb={10}>
            <GeneralFigures />
          </Box>
          <Box mb={10}>
            <MonthFigures />
          </Box>
          <Hidden smDown>
            {!!store.dashboard.data.overview && <YearFigures />}
          </Hidden>
        </>
      )}
    </Page>
  );
});

export default withAuthentication(Dashboard);
