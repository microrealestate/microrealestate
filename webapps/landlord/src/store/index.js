import { createContext, useEffect, useState } from 'react';
import { isClient, isServer } from '@microrealestate/commonui/utils';

import config from '../config';
import { enableStaticRendering } from 'mobx-react-lite';
import { setOrganizationId } from '../utils/fetch';
import Store from './Store';

enableStaticRendering(isServer());

let _store;

export function getStoreInstance(initialData) {
  if (isServer()) {
    _store = new Store();
  }

  if (!_store) {
    _store = new Store();
    _store.hydrate(initialData);
    if (config.NODE_ENV === 'development') {
      window.__store = _store;
    }
  }

  return _store;
}

export const StoreContext = createContext();

export function InjectStoreContext({ children, initialData }) {
  const [store, setStore] = useState();

  useEffect(() => {
    const newStore = getStoreInstance(initialData);
    setStore(newStore);
  }, [initialData]);

  useEffect(() => {
    if (isClient() && config.NODE_ENV === 'development') {
      window.__store = store;
    }
  }, [store, store?.organization?.selected?.locale]);

  return store ? (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  ) : null;
}

export async function setupOrganizationsInStore(selectedOrgName) {
  if (!_store) {
    console.error(
      'the store is not created. Fill organizations in store is not possible'
    );
    return;
  }

  await _store.organization.fetch();
  // Select the organization if set in the url otherwise take the firstone in the list
  if (_store.organization.items.length && !_store.organization.selected) {
    let selectedOrganization;
    if (selectedOrgName) {
      selectedOrganization = _store.organization.items.find(
        ({ name }) => name === selectedOrgName
      );
    }
    if (!selectedOrganization) {
      selectedOrganization = _store.organization.items[0];
    }
    _store.organization.setSelected(selectedOrganization, _store.user);
    setOrganizationId(_store.organization.selected._id);
  }
}
