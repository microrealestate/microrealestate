'use client';

import type { Session, SessionStatus } from '@/types';
import { useEffect, useRef, useState } from 'react';
import getEnv from '@/utils/env/client';
import mockedSession from '@/mocks/session';
import useApiFetcher from '@/utils/fetch/client';

export default function useSession(): {
  status: SessionStatus;
  session: Session | null;
} {
  const apiFetcher = useApiFetcher();
  const hasBeenFetched = useRef(false);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function fetch() {
      let currentSession = null;
      try {
        setStatus('loading');
        hasBeenFetched.current = true;
        const {
          data: { email }
        } = await apiFetcher.get('/api/v2/authenticator/tenant/session');
        currentSession = { email };
      } catch (e) {
        console.error(e);
      } finally {
        setSession(currentSession);
        setStatus(currentSession?.email ? 'authenticated' : 'unauthenticated');
      }
    }

    if (getEnv('DEMO_MODE') === 'true') {
      setSession(mockedSession);
      setStatus(mockedSession.status);
    } else {
      !hasBeenFetched.current && fetch();
    }
  }, [apiFetcher]);

  return { status, session };
}
