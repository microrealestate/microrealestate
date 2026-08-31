import type { Request } from 'express';
import type { CookieOptions } from 'express-serve-static-core';

export function getTokenCookieAttributes(req: Request): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.secure
  };
}
