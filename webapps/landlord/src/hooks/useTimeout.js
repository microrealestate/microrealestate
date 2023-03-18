import { useCallback, useEffect, useRef, useState } from 'react';

export default function useTimeout(fn, delay) {
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const fnClearRef = useRef(() => {
    timerRef.current && clearTimeout(timerRef.current);
    setIsRunning(false);
  });

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const timerRef = useRef();
  const start = useCallback(
    (...params) => {
      fnClearRef.current();
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
    [delay]
  );

  return { start, clear: fnClearRef.current, isRunning, isDone };
}
