import { MockedSession } from '../common';
import type { Session } from '@/types';

export const authOptions: { used: boolean } = { used: true };

export async function getServerSession(authOptions: {
  used: boolean;
}): Promise<Session | null> {
  authOptions['used'] = true;
  return MockedSession;
}
