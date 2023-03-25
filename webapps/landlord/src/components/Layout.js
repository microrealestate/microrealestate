import AppBar from './AppBar';
import { Box } from '@material-ui/core';
import Hidden from './HiddenSSRCompatible';
import Nav from './Nav';
import Toast from './Toast';

export default function Layout({ showNav, children }) {
  return (
    <>
      <AppBar />
      <Hidden mdUp>
        <Box
          display="flex"
          flexDirection="column"
          flexWrap="nowrap"
          overflow="hidden"
        >
          {children}
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
