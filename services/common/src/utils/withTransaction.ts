import type { ClientSession } from 'mongoose';
import * as Collections from '../collections';

export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await Collections.startSession();
  try {
    const result = await fn(session);
    return result;
  } finally {
    session.endSession();
  }
}
