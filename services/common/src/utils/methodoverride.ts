import type { NextFunction, Request, RequestHandler, Response } from 'express';
import methods from 'methods';
import vary from 'vary';

const HEADER_NAME = 'X-HTTP-Method-Override';

declare global {
  namespace Express {
    interface Request {
      originalMethod?: string;
    }
  }
}

/**
 * Method override middleware for X-HTTP-Method-Override header
 * Only applies to POST requests by default
 * Handles comma-separated header values
 */
export default function methodOverride(): RequestHandler {
  return function methodOverrideMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    req.originalMethod = req.originalMethod || req.method;

    // Only apply to POST requests
    if (req.originalMethod !== 'POST') {
      return next();
    }

    // Get the override method from header
    const headerValue = req.headers[HEADER_NAME.toLowerCase()];

    if (headerValue) {
      // Handle string | string[] type for headers
      const headerString = Array.isArray(headerValue)
        ? headerValue[0]
        : headerValue;

      if (headerString) {
        const method = headerString.includes(',')
          ? headerString.split(',')[0]?.trim()
          : headerString.trim();

        if (method && isValidMethod(method)) {
          req.method = method.toUpperCase();
          vary(res, HEADER_NAME);
        }
      }
    }

    next();
  };
}

function isValidMethod(method: string): boolean {
  return (
    typeof method === 'string' &&
    methods.map((m) => m.toUpperCase()).includes(method.toUpperCase())
  );
}
