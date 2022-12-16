import { useContext, useEffect, useState } from 'react';

import Layout from './Layout';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';
import { useRouter } from 'next/router';

function Application({ children }) {
  const store = useContext(StoreContext);
  const [routeloading, setRouteLoading] = useState(false);
  const router = useRouter();

  const showNav = !!(
    store.user.signedIn &&
    store.organization.items &&
    store.organization.items.length
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

  return <Layout showNav={showNav}>{!routeloading && children}</Layout>;
}

export default observer(Application);
