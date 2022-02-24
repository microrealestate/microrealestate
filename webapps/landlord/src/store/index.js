import { createContext, useEffect, useState } from 'react';
import { isClient, isServer } from '../utils';

import { enableStaticRendering } from 'mobx-react-lite';
import moment from 'moment';
import Store from './Store';

enableStaticRendering(isServer());

let _store;

function getStoreInstance(initialData) {
  if (isServer()) {
    return new Store();
  }

  if (!_store) {
    console.log('create store');
    _store = new Store();
    _store.hydrate(initialData);
    if (process.env.NODE_ENV === 'development') {
      window.__store = _store;
    }
  }

  return _store;
}

const StoreContext = createContext();

function InjectStoreContext({ children, initialData }) {
  const [store, setStore] = useState();

  useEffect(() => {
    moment.locale(initialData?.organization?.selected?.locale ?? 'en');
    const newStore = getStoreInstance(initialData);
    setStore(newStore);
    if (isClient() && process.env.NODE_ENV === 'development') {
      window.__store = newStore;
    }
  }, [initialData]);

  return store ? (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  ) : null;
}

export { InjectStoreContext, StoreContext, getStoreInstance };
