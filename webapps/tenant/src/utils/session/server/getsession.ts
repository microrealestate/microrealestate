import config from '@/config';
import getApiFetcher from '@/utils/fetch/server';
import mockedSession from '@/mocks/session';
import type { Session } from '@/types';

export default async function getServerSession(): Promise<Session | null> {
  let session = null;
  if (config.DEMO_MODE) {
    session = mockedSession;
  } else {
    try {
      const response = await getApiFetcher().get(
        '/api/v2/authenticator/tenant/session'
      );
      session = response.data;
    } catch (e) {
      console.error(e);
    }
  }
  return session;
}
