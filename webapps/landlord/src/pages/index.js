import { isServer, redirect } from '../utils';

import { getStoreInstance } from '../store';
import { setOrganizationId } from '../utils/fetch';
import { toJS } from 'mobx';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { withAuthentication } from '../components/Authentication';

const Index = (props) => {
  const { redirectPath } = props;
  const router = useRouter();

  useEffect(() => {
    router.push(redirectPath);
  }, [router, redirectPath]);

  return null;
};

Index.getInitialProps = async (context) => {
  console.log('Index.getInitialProps');
  const store = isServer() ? context.store : getStoreInstance();

  let redirectPath = '/firstaccess';
  if (store.organization.items.length) {
    if (!store.organization.selected) {
      store.organization.setSelected(store.organization.items[0], store.user);
      setOrganizationId(store.organization.items[0]._id);
    }
    redirectPath = `/${store.organization.selected.name}/dashboard`;
  }

  if (isServer()) {
    redirect(context, redirectPath);
  }

  const props = {
    redirectPath,
    initialState: {
      store: toJS(store),
    },
  };
  return props;
};

export default withAuthentication(Index);
