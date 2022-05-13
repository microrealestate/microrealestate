import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import Alert from '@material-ui/lab/Alert';
import { observer } from 'mobx-react-lite';
import Snackbar from '@material-ui/core/Snackbar';
import { StoreContext } from '../store';

export function useComponentMountedRef() {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => (mountedRef.current = false);
  });

  return mountedRef;
}

export function useTimeout(fn, delay) {
  const mountedRef = useComponentMountedRef();
  const fnRef = useRef(fn);
  const timerRef = useRef();
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn, clear]);

  const clear = useCallback(() => {
    timerRef.current && clearTimeout(timerRef.current);
  }, []);

  const start = useCallback(
    (...params) => {
      clear();
      setIsRunning(true);
      setIsDone(false);
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) {
          return clear();
        }
        if (fnRef.current) {
          await fnRef.current(...params);
          setIsRunning(false);
          setIsDone(true);
        }
      }, delay);
    },
    [clear, delay, mountedRef]
  );

  return { start, clear, isRunning, isDone };
}

export function useInterval(fn, delay) {
  const mountedRef = useComponentMountedRef();
  const fnRef = useRef(fn);
  const timerRef = useRef();
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn, clear]);

  const clear = useCallback(() => {
    timerRef.current && clearInterval(timerRef.current);
  }, []);

  const start = useCallback(
    (...params) => {
      clear();
      setIsRunning(true);
      timerRef.current = setInterval(async () => {
        if (!mountedRef.current) {
          return clear();
        }
        if (fnRef.current) {
          await fnRef.current(...params);
          setIsRunning(false);
        }
      }, delay);
    },
    [clear, delay, mountedRef]
  );

  return { start, clear, isRunning };
}

export function useToast() {
  const Toast = () => {
    const store = useContext(StoreContext);

    const toastData = store.toastMessages?.length
      ? store.toastMessages[0]
      : null;

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
  };

  return observer(Toast);
}

export function useDialog(DialogComponent) {
  const [open, setOpen] = useState(false);

  const Dialog = (props) => {
    return <DialogComponent {...props} open={open} setOpen={setOpen} />;
  };

  return [Dialog, setOpen, open];
}
