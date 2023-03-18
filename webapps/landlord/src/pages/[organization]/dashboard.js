import { useContext, useMemo } from 'react';

import { Box } from '@material-ui/core';
import GeneralFigures from '../../components/dashboard/GeneralFigures';
import Hidden from '../../components/HiddenSSRCompatible';
import MonthFigures from '../../components/dashboard/MonthFigures';
import { observer } from 'mobx-react-lite';
import Page from '../../components/Page';
import Shortcuts from '../../components/dashboard/Shortcuts';
import { StoreContext } from '../../store';
import useFillStore from '../../hooks/useFillStore';
import Welcome from '../../components/Welcome';
import { withAuthentication } from '../../components/Authentication';
import YearFigures from '../../components/dashboard/YearFigures';

async function fetchData(store) {
  return await Promise.all([
    store.dashboard.fetch(),
    store.tenant.fetch(),
    store.lease.fetch(),
  ]);
}

const Dashboard = observer(() => {
  const store = useContext(StoreContext);
  const [fetching] = useFillStore(fetchData);

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
    <Page loading={fetching}>
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
