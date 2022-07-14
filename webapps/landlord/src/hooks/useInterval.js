import { useCallback, useEffect, useRef, useState } from 'react';

import useComponentMountedRef from './useComponentMountedRef';

export default function useInterval(fn, delay) {
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
