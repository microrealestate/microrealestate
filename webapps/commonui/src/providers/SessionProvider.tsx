'use client';

import { createContext, useContext, useMemo } from 'react';

// Using localized types instead of global @/types to keep commonui portable
type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';
type BaseSession = {
  account?: unknown; // Landlord format
  email?: string; // Tenant format
  [key: string]: unknown;
};

type SessionContextType = {
  status: SessionStatus;
  session: BaseSession | null;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({
  children,
  session
}: {
  children: React.ReactNode;
  session: BaseSession | null;
}) {
  const value = useMemo(
    () => ({
      session,
      status: session
        ? ('authenticated' as SessionStatus)
        : ('unauthenticated' as SessionStatus)
    }),
    [session]
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
