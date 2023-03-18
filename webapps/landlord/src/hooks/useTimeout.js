import { useCallback, useEffect, useRef, useState } from 'react';

export default function useTimeout(fn, delay) {
  const fnRef = useRef(fn);
  const timerRef = useRef();
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const clear = useCallback(() => {
    timerRef.current && clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn, clear]);

  const start = useCallback(
    (...params) => {
      clear();
      setIsRunning(true);
      setIsDone(false);
      timerRef.current = setTimeout(async () => {
        if (fnRef.current) {
          await fnRef.current(...params);
          setIsRunning(false);
          setIsDone(true);
        }
      }, delay);
    },
    [clear, delay]
  );

  return { start, clear, isRunning, isDone };
}
