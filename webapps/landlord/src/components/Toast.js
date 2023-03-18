import { useCallback, useContext } from 'react';

import Alert from '@material-ui/lab/Alert';
import { observer } from 'mobx-react-lite';
import { Snackbar } from '@material-ui/core';
import { StoreContext } from '../store';

const Toast = observer(function Toast() {
  const store = useContext(StoreContext);

  const toastData = store.toastMessages?.length ? store.toastMessages[0] : null;

  const handleClose = useCallback(() => {
    store.shiftToastMessage();
  }, [store]);

  return (
    <Snackbar
      open={!!toastData?.message}
      autoHideDuration={3000}
      onClose={handleClose}
    >
      {toastData?.message ? (
        <Alert
          elevation={6}
          variant="filled"
          severity={toastData?.severity || 'error'}
        >
          {toastData?.message}
        </Alert>
      ) : null}
    </Snackbar>
  );
});

export default Toast;
