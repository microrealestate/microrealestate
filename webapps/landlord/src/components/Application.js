import { useContext, useEffect } from 'react';

import { Box } from '@material-ui/core';
import moment from 'moment';
import Nav from './Nav';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';

const Application = observer(({ children }) => {
  console.log('Application functional component');
  const store = useContext(StoreContext);
  const displayNav = !!(
    store.user.signedIn &&
    store.organization.items &&
    store.organization.items.length
  );

  useEffect(() => {
    if (store.user.signedIn && store.organization.selected?.locale) {
      moment.locale(store.organization.selected.locale);
    }
  }, [store.user.signedIn, store.organization.selected?.locale]);

  return (
    <Box display="flex">
      {displayNav && <Nav />}
      <Box flexGrow={1}>{children}</Box>
    </Box>
  );
});

export default Application;
