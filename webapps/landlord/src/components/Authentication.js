import { setupOrganizationsInStore, StoreContext } from '../store';

import config from '../config';
import ErrorPage from 'next/error';
import { useContext } from 'react';
import useFillStore from '../hooks/useFillStore';
import { useRouter } from 'next/router';

async function fetchData(store, router) {
  if (store.user.signedIn) {
    return store.organization.items;
  }

  await setupOrganizationsInStore(router.query.organization);
  return store.organization.items;
}

export function withAuthentication(PageComponent, grantedRole) {
  function WithAuth(pageProps) {
    const store = useContext(StoreContext);
    const router = useRouter();
    const [fetching] = useFillStore(fetchData, [router]);

    if (fetching) {
      return null;
    }

    if (store.user.signedIn === false) {
      window.location.assign(`${config.BASE_PATH}/signin`);
      return null;
    }

    if (
      router.pathname !== '/firstaccess' &&
      !store.organization.items.length
    ) {
      window.location.assign(`${config.BASE_PATH}/firstaccess`);
      return null;
    }

    if (grantedRole && grantedRole !== store.user.role) {
      return <ErrorPage statusCode={404} />;
    }

    return <PageComponent {...pageProps} />;
  }

  return WithAuth;
}
