import type { SessionStatus, Session } from '@/types';
import useApiFetcher from '@/utils/fetch/client';
import { useEffect, useState } from 'react';

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
    fetch();
  });

  return { status, session };
}
