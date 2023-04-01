import { useContext, useEffect, useState } from 'react';

import DateFnsUtils from '@date-io/moment';
import Layout from './Layout';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';

function Application({ children }) {
  const store = useContext(StoreContext);
  const [routeloading, setRouteLoading] = useState(false);
  const router = useRouter();

  const showNav = !!(
    store.organization.items && store.organization.items.length
  );

  useEffect(() => {
    const routeChangeStart = (url, { shallow }) => {
      if (!shallow) {
        setRouteLoading(true);
      }
    };
    const routeChangeComplete = (url, { shallow }) => {
      if (!shallow) {
        setRouteLoading(false);
      }
    };

    router.events.on('routeChangeStart', routeChangeStart);
    router.events.on('routeChangeComplete', routeChangeComplete);

    return () => {
      router.events.off('routeChangeStart', routeChangeStart);
      router.events.off('routeChangeComplete', routeChangeComplete);
    };
  }, [router]);

  return (
    <MuiPickersUtilsProvider
      utils={DateFnsUtils}
      locale={store?.organization?.selected?.locale ?? 'en'}
    >
      <Layout showNav={showNav}>{!routeloading && children}</Layout>
    </MuiPickersUtilsProvider>
  );
}

export default observer(Application);
