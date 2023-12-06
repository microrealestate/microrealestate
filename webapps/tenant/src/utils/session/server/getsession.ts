import getApiFetcher from '@/utils/fetch/server';
import type { Session } from '@/types';

export default async function getServerSession(): Promise<Session | null> {
  let session = null;
  try {
    const response = await getApiFetcher().get(
      '/api/v2/authenticator/tenant/session'
    );
    session = response.data;
  } catch (e) {
    console.error(e);
  }
  return session;
}
