import { createContext, useEffect, useState } from 'react';
import { isClient, isServer } from '../utils';

import Store from './Store';
import { enableStaticRendering } from 'mobx-react-lite';

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
    setStore(getStoreInstance(initialData));
    if (isClient() && process.env.NODE_ENV === 'development') {
      window.__store = store;
    }
  }, []);

  return store ? (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  ) : null;
}

export { InjectStoreContext, StoreContext, getStoreInstance };
