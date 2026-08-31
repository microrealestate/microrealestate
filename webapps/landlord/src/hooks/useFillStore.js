import { useEffect, useRef, useState } from 'react';

import { useStore } from '@/providers/StoreProvider';

export default function useFillStore(fetchData, params = []) {
  const paramsRef = useRef();
  paramsRef.current = params;

  const store = useStore();
  const [fetching, setFetching] = useState(true);
  const [results, setResults] = useState();

  useEffect(() => {
    const fillStore = async () => {
      let data;
      try {
        data = await fetchData(store, ...paramsRef.current);
      } catch (error) {
        console.error(error);
      } finally {
        setResults(data);
        setFetching(false);
      }
    };
    fillStore();
  }, [fetchData, store]);

  return [fetching, results];
}
