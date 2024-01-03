import type { Session, SessionStatus } from '@/types';
import { useEffect, useState } from 'react';
import getServerEnv from '@/utils/env/server';
import mockedSession from '@/mocks/session';
import useApiFetcher from '@/utils/fetch/client';

export default function useSession(): {
  status: SessionStatus;
  session: Session | null;
  } {
  const apiFetcher = useApiFetcher();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function fetch() {
      let session = null;
      try {
        setStatus('loading');
        const { data: email } = await apiFetcher.get(
          '/api/v2/authenticator/tenant/session'
        );
        session = { email };
      } catch (e) {
        console.error(e);
      } finally {
        setSession(session);
        setStatus(session?.email ? 'authenticated' : 'unauthenticated');
      }
    }
    if (getServerEnv('DEMO_MODE') === 'true') {
      setSession(mockedSession);
      setStatus(mockedSession.status);
    } else {
      fetch();
    }
  }, [apiFetcher]);

  return { status, session };
}
