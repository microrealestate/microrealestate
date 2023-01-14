import { Box } from '@material-ui/core';
import Hidden from './HiddenSSRCompatible';
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
