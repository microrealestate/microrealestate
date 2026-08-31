'use client';

import { createContext, useContext, useMemo } from 'react';

const EnvContext = createContext<Record<string, string | undefined> | null>(
  null
);

interface EnvProviderProps {
  children: React.ReactNode;
  env: Record<string, string | undefined>;
}

export default function EnvProvider({ children, env }: EnvProviderProps) {
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}

export function useEnv(key: string): string | undefined {
  const envContext = useContext(EnvContext);

  return useMemo(() => {
    if (envContext && `NEXT_PUBLIC_${key}` in envContext) {
      return envContext[`NEXT_PUBLIC_${key}`];
    }
    return undefined;
  }, [envContext, key]);
}
