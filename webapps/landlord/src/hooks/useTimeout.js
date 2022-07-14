import { useCallback, useEffect, useRef, useState } from 'react';

import useComponentMountedRef from './useComponentMountedRef';

export default function useTimeout(fn, delay) {
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
