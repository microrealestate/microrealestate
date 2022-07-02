import Layout from './Layout';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';
import { useContext } from 'react';

function Application({ children }) {
  console.log('Application functional component');
  const store = useContext(StoreContext);

  const showNav = !!(
    store.user.signedIn &&
    store.organization.items &&
    store.organization.items.length
  );

  return <Layout showNav={showNav}>{children}</Layout>;
}

export default observer(Application);
