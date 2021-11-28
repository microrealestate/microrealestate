import { Box } from '@material-ui/core';
import Nav from './Nav';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../store';
import { useContext } from 'react';

const Application = observer(({ children }) => {
  console.log('Application functional component');
  const store = useContext(StoreContext);
  const displayNav = !!(
    store.user.signedIn &&
    store.organization.items &&
    store.organization.items.length
  );

  return (
    <Box display="flex">
      {displayNav && <Nav />}
      <Box flexGrow={1}>{children}</Box>
    </Box>
  );
});

export default Application;
