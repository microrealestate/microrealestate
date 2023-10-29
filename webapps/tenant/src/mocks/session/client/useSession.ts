import { MockedSession } from '../common';
import type { Session } from '@/types';

export default function useSession(): {
  data: Session | null;
} {
  return {
    data: MockedSession,
  };
}
