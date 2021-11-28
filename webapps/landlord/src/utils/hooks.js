import { useCallback, useEffect, useRef, useState } from 'react';

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
