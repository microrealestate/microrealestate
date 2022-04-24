import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';

export const useComponentMountedRef = () => {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => (mountedRef.current = false);
  });

  return mountedRef;
};

export const useTimeout = (fn, delay) => {
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

  const start = useCallback((...params) => {
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
  }, []);

  return { start, clear, isRunning, isDone };
};

export const useInterval = (fn, delay) => {
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

  const start = useCallback((...params) => {
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
  }, []);

  return { start, clear, isRunning };
};

export const useToast = () => {
  const [toastMessage, setToastMessage] = useState('');

  const toastVisible = useMemo(() => !!toastMessage, [toastMessage]);

  const Toast = ({ severity, onClose }) => {
    const handleClose = useCallback(() => {
      setToastMessage('');
      onClose && onClose();
    }, [onClose]);

    return (
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <Alert elevation={6} variant="filled" severity={severity}>
          {toastMessage}
        </Alert>
      </Snackbar>
    );
  };

  return [Toast, setToastMessage, toastVisible];
};
