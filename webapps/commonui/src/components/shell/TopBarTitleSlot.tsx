'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState
} from 'react';

type TopBarTitleSlotValue = {
  slot: HTMLElement | null;
  setSlot: (slot: HTMLElement | null) => void;
  hasPageTitle: boolean;
  setHasPageTitle: (hasPageTitle: boolean) => void;
};

const noop = () => {};

const TopBarTitleSlotContext = createContext<TopBarTitleSlotValue>({
  slot: null,
  setSlot: noop,
  hasPageTitle: false,
  setHasPageTitle: noop
});

export function TopBarTitleProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [hasPageTitle, setHasPageTitle] = useState(false);
  const value = useMemo(
    () => ({ slot, setSlot, hasPageTitle, setHasPageTitle }),
    [slot, hasPageTitle]
  );

  return (
    <TopBarTitleSlotContext.Provider value={value}>
      {children}
    </TopBarTitleSlotContext.Provider>
  );
}

export function useTopBarTitleSlot() {
  return useContext(TopBarTitleSlotContext);
}
