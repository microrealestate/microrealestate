import { Box, Hidden } from '@material-ui/core';

import Nav from './Nav';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';
import { useContext } from 'react';
import { useToast } from '../utils/hooks';

function MobileApplication({ children, showNav }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      flexWrap="nowrap"
      overflow="hidden"
    >
      <Box mb={10}>{children}</Box>
      {showNav && <Nav />}
    </Box>
  );
}

function DesktopApplication({ children, showNav }) {
  return (
    <Box display="flex">
      {showNav && <Nav />}
      <Box flexGrow={1}>{children}</Box>
    </Box>
  );
}

function Application({ children }) {
  console.log('Application functional component');
  const store = useContext(StoreContext);
  const Toast = useToast();

  const showNav = !!(
    store.user.signedIn &&
    store.organization.items &&
    store.organization.items.length
  );

  return (
    <>
      <Hidden mdUp>
        <MobileApplication showNav={showNav}>{children}</MobileApplication>
      </Hidden>
      <Hidden smDown>
        <DesktopApplication showNav={showNav}>{children}</DesktopApplication>
      </Hidden>
      <Toast />
    </>
  );
}

export default observer(Application);
