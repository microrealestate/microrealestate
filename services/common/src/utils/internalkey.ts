import crypto from 'node:crypto';
import type { InternalKeyPurpose } from '@microrealestate/shared';

export const HEADER = 'x-internal-key';

export function generate(
  accessTokenSecret: string,
  purpose: InternalKeyPurpose
): string {
  if (!accessTokenSecret) {
    throw new Error(
      'ACCESS_TOKEN_SECRET is required to derive the internal key'
    );
  }
  return crypto
    .createHmac('sha256', accessTokenSecret)
    .update(purpose)
    .digest('hex');
}

export function matches(expected: string, received?: unknown): boolean {
  if (typeof received !== 'string' || !received) {
    return false;
  }
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(received).digest();
  return crypto.timingSafeEqual(a, b);
}
