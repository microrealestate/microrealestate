import { Box, Hidden } from '@material-ui/core';

import Nav from './Nav';
import useToast from '../hooks/useToast';

export default function Layout({ showNav, children }) {
  const Toast = useToast();
  return (
    <>
      <Hidden mdUp>
        <Box
          display="flex"
          flexDirection="column"
          flexWrap="nowrap"
          overflow="hidden"
        >
          <Box mb={10}>{children}</Box>
          {showNav && <Nav />}
        </Box>
      </Hidden>
      <Hidden smDown>
        {showNav && <Nav />}
        {children}
      </Hidden>
      <Toast />
    </>
  );
}
