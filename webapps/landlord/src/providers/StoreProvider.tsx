'use client';

import { enableStaticRendering } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useState } from 'react';
import Store from '@/store/Store';

enableStaticRendering(typeof window === 'undefined');

// Let the context default to null but type it as `Store | null`
const StoreContext = createContext<Store | null>(null);

export default function StoreProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new Store());

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Store {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
