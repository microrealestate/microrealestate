import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8080';

function injectSession(response: Response, session: Session): Response {
  // Inject session as a request header using Next.js's internal convention.
  // x-middleware-request-* headers are read by the server and made available
  // to Server Components via headers(), but never exposed to the browser.
  const overrides = response.headers.get('x-middleware-override-headers') || '';
  const keys = overrides ? overrides.split(',') : [];
  if (!keys.includes('x-session')) {
    keys.push('x-session');
  }
  response.headers.set('x-middleware-override-headers', keys.join(','));
  response.headers.set(
    'x-middleware-request-x-session',
    session ? JSON.stringify(session) : ''
  );
  return response;
}

function nextWithSession(session: Session, request: NextRequest) {
  const response = intlMiddleware(request);
  return injectSession(response, session);
}

export const config = {
  matcher: [
    '/((?!api|_next|__nextjs|health|favicon.ico|.*\\.(?:svg|woff2?|ttf|png|jpe?g|ico)).*)',
    '/'
  ]
};

type Session = Record<string, unknown> | null;

export async function middleware(request: NextRequest) {
  console.log('===>[MIDDLEWARE]', request.nextUrl.pathname, 'request received');

  const restrictedPath = isRestrictedRequest(request);
  const session = await getSession(request);

  console.log(
    `===>[MIDDLEWARE] ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search} restricted=${restrictedPath} session=${session ? 'present' : 'null'}`
  );

  if (restrictedPath) {
    console.log(
      '===>[MIDDLEWARE] check redirect signin for',
      request.nextUrl.pathname
    );
    const response = redirectSignin(session, request);
    if (response) {
      return response;
    }

    console.log(
      '===>[MIDDLEWARE] check redirect home for',
      request.nextUrl.pathname
    );
    const homeResponse = redirectHome(request, session);
    if (homeResponse) {
      return homeResponse;
    }

    console.log(
      '===>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'passing to server with session'
    );
    return nextWithSession(session, request);
  } else if (session) {
    const pathname = request.nextUrl.pathname;
    const isSigninOrOtp = /\/(signin|otp(\/[^/]+)?)$/.test(pathname);

    if (isSigninOrOtp) {
      console.log(
        '===>[MIDDLEWARE] check redirect root for',
        request.nextUrl.pathname
      );
      const url = encodeNextURL(request);
      console.log(
        '===>[MIDDLEWARE]',
        request.nextUrl.pathname,
        'redirected to',
        url.pathname
      );
      return NextResponse.redirect(url);
    }

    console.log(
      '===>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'non-restricted, session present, not signin/otp — delegating to next-intl'
    );
  }

  console.log(
    '===>[MIDDLEWARE]',
    request.nextUrl.pathname,
    'delegating to next-intl middleware'
  );
  return nextWithSession(session, request);
}

function redirectSignin(session: Session, request: NextRequest) {
  if (!session) {
    const url = encodeNextURL(request, 'signin');
    console.log(
      '===>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'no session — redirected to',
      url.pathname
    );
    return NextResponse.redirect(url);
  }
  return null;
}

function redirectHome(request: NextRequest, session: Session) {
  const pathname = request.nextUrl.pathname;
  const locale = getRequestLocale(request);
  if (pathname === '/' || pathname === `/${locale}`) {
    const url = encodeNextURL(request, 'noticesandreceipts');
    const response = NextResponse.redirect(url);
    return injectSession(response, session);
  }
  return null;
}

function negotiateAcceptLanguage(header: string | null) {
  if (!header) {
    return null;
  }
  // Quality-sorted client languages (drop the "*" wildcard, which is not a
  // valid BCP-47 tag and would make the matcher throw).
  const languages = new Negotiator({
    headers: { 'accept-language': header }
  })
    .languages()
    .filter((language) => language !== '*');
  if (languages.length === 0) {
    return null;
  }
  try {
    // RFC 4647 best-fit match; handles "en-US" → "en", "fr" → "fr-FR", etc.
    return match(
      languages,
      routing.locales as unknown as string[],
      routing.defaultLocale
    );
  } catch (e) {
    console.error('===>[MIDDLEWARE] negotiateAcceptLanguage', e);
    return null;
  }
}

function getRequestLocale(request: NextRequest) {
  try {
    const negotiated = negotiateAcceptLanguage(
      request.headers.get('accept-language')
    );
    if (negotiated) {
      return negotiated;
    }
    return routing.defaultLocale;
  } catch (e) {
    console.error('===>[MIDDLEWARE]', e);
    return routing.defaultLocale;
  }
}

async function getSession(request: NextRequest): Promise<Session> {
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value || '';
    if (!sessionToken) {
      console.log('===>[MIDDLEWARE] getSession: no sessionToken cookie');
      return null;
    }

    console.log(
      '===>[MIDDLEWARE] getSession: sessionToken present, calling session API'
    );
    const response = await fetch(
      `${GATEWAY_URL}/api/v2/authenticator/tenant/session`,
      {
        headers: {
          cookie: `sessionToken=${sessionToken}`
        },
        signal: AbortSignal.timeout(5000)
      }
    );

    console.log(
      '===>[MIDDLEWARE] getSession: session API returned',
      response.status
    );
    if (response.status === 200) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('===>[MIDDLEWARE] getSession: error', String(error));
    return null;
  }
}

function isRestrictedRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicPathRegex = /\/(signin|otp(\/[^/]+)?)$/;
  const restricted = !publicPathRegex.test(pathname);
  console.log(
    `===>[MIDDLEWARE] isRestrictedRequest: pathname="${pathname}" → ${restricted}`
  );
  return restricted;
}

function encodeNextURL(request: NextRequest, ...segments: string[]) {
  // Do NOT prepend BASE_PATH here: request.nextUrl.clone() preserves the
  // basePath and Next.js re-adds it when the URL is serialized for the redirect.
  // Prepending it manually would double-prefix (e.g. /tenant/tenant/en/signin).
  const aUrl = [];
  const locale = getRequestLocale(request);
  aUrl.push(encodeURIComponent(locale));
  segments.forEach((segment) => {
    aUrl.push(encodeURIComponent(segment));
  });
  let encodedUrl = aUrl.join('/') ?? '';
  if (!encodedUrl.startsWith('/')) {
    encodedUrl = `/${encodedUrl}`;
  }
  const url = request.nextUrl.clone();
  url.pathname = encodedUrl;
  console.log(
    `===>[MIDDLEWARE] encodeNextURL: locale="${locale}" segments=[${segments.join(',')}] → ${url.href}`
  );
  return url;
}
