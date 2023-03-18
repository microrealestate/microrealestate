import { useContext, useEffect, useRef, useState } from 'react';

import { StoreContext } from '../store';

export default function useFillStore(fetchData, params = []) {
  const paramsRef = useRef();
  paramsRef.current = params;

  const store = useContext(StoreContext);
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
