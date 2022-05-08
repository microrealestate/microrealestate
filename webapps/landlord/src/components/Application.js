import { Box, Hidden } from '@material-ui/core';

import Nav from './Nav';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';
import { useContext } from 'react';
import { useToast } from '../utils/hooks';

const Application = observer(({ children }) => {
  console.log('Application functional component');
  const store = useContext(StoreContext);
  const Toast = useToast();

  const displayNav = !!(
    store.user.signedIn &&
    store.organization.items &&
    store.organization.items.length
  );

  return (
    <>
      <Hidden mdUp>
        <Box display="flex" flexDirection="column" flexWrap="nowrap">
          <Box mb={10}>{children}</Box>
          {displayNav && <Nav />}
        </Box>
      </Hidden>
      <Hidden smDown>
        <Box display="flex">
          {displayNav && <Nav />}
          <Box flexGrow={1}>{children}</Box>
        </Box>
      </Hidden>
      <Toast />
    </>
  );
});

export default Application;
