'use client';
import type { AppContext, Toast } from '@/types';
import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

const appContext: AppContext = {
  toast: null,
  setToast() {},
};
export const ApplicationContext = createContext<AppContext>(appContext);

export default function ApplicationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toast, setToast] = useState<Toast | null>(null);

  return (
    <ApplicationContext.Provider value={{ toast, setToast }}>
      {children}
    </ApplicationContext.Provider>
  );
}
