import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { BASE_PATH } from './utils/basepath';
import { sanitizeRedirect } from './utils/redirect';

const intlMiddleware = createIntlMiddleware(routing);

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8080';

function injectSession(response, session) {
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

function nextWithSession(session, request) {
  return injectSession(intlMiddleware(request), session);
}

function getPathname(pathname) {
  return pathname.replace(new RegExp(`^${BASE_PATH}`), '') || '/';
}

export const config = {
  matcher: [
    '/((?!api|_next|__nextjs|health|favicon.ico|.*\\.(?:svg|woff2?|ttf|png|jpe?g|ico)).*)',
    '/'
  ]
};

export async function middleware(request) {
  console.log(
    '====>[MIDDLEWARE]',
    request.nextUrl.pathname,
    'request received'
  );

  const restrictedPath = isRestrictedRequest(request);
  const session = await getSession(request);

  if (restrictedPath) {
    console.log(
      '====>[MIDDLEWARE] check redirect signin for',
      request.nextUrl.pathname
    );
    let response = redirectSignin(session, request);
    if (response) {
      return response;
    }

    console.log(
      '====>[MIDDLEWARE] check redirect change password for',
      request.nextUrl.pathname
    );
    response = redirectChangePassword(session, request);
    if (response) {
      return response;
    }

    console.log(
      '====>[MIDDLEWARE] check redirect setup organization for',
      request.nextUrl.pathname
    );
    response = redirectSetupOrganization(session, request);
    if (response) {
      return response;
    }

    console.log(
      '====>[MIDDLEWARE] check setup domain for',
      request.nextUrl.pathname
    );
    response = allowSetupDomain(session, request);
    if (response) {
      return response;
    }

    console.log(
      '====>[MIDDLEWARE] check redirect home for',
      request.nextUrl.pathname
    );
    response = redirectHome(session, request);
    if (response) {
      return response;
    }

    console.log(
      '====>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'passing to server with session'
    );
    return nextWithSession(session, request);
  } else if (session?.account) {
    console.log(
      '====>[MIDDLEWARE] check redirect root for',
      request.nextUrl.pathname
    );
    const url = encodeNextURL(session, request);
    console.log(
      '====>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'redirected to',
      url.pathname
    );
    return NextResponse.redirect(url);
  }

  console.log(
    '====>[MIDDLEWARE]',
    request.nextUrl.pathname,
    'delegating to next-intl middleware'
  );
  return nextWithSession(session, request);
}

function redirectSignin(session, request) {
  if (!session?.account) {
    const url = encodeNextURL(session, request, 'signin');
    const pathname = request.nextUrl.pathname;
    const withBase = pathname.startsWith(BASE_PATH)
      ? pathname
      : BASE_PATH + pathname;
    const original = withBase + request.nextUrl.search;
    if (isMeaningfulRedirect(original)) {
      url.searchParams.set('redirectTo', original);
    }
    console.log(
      '====>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'redirected to',
      url.pathname
    );
    return NextResponse.redirect(url);
  }
  return null;
}

function isMeaningfulRedirect(original) {
  const stripped = getPathname(original.split('?')[0]);
  const segments = stripped.split('/').filter(Boolean);
  if (segments.length === 0) return false;
  if (segments.length === 1 && routing.locales.includes(segments[0])) {
    return false;
  }
  return sanitizeRedirect(original) !== null;
}

function redirectChangePassword(session, request) {
  const pathname = getPathname(request.nextUrl.pathname);
  if (session?.account?.mustChangePassword) {
    if (!pathname.endsWith('/changepassword')) {
      const url = encodeNextURL(session, request, 'changepassword');
      console.log(
        '====>[MIDDLEWARE]',
        request.nextUrl.pathname,
        'redirected to',
        url.pathname
      );
      return NextResponse.redirect(url);
    }
    return nextWithSession(session, request);
  }
  if (pathname.endsWith('/changepassword')) {
    const url = encodeNextURL(session, request);
    return NextResponse.redirect(url);
  }
  return null;
}

function redirectSetupOrganization(session, request) {
  const pathname = getPathname(request.nextUrl.pathname);
  const organization = session?.account?.organization;
  if (!organization) {
    if (!pathname.endsWith('/setuporganization')) {
      const url = encodeNextURL(session, request, 'setuporganization');
      console.log(
        '====>[MIDDLEWARE]',
        request.nextUrl.pathname,
        'redirected to',
        url.pathname
      );
      return NextResponse.redirect(url);
    }
    return nextWithSession(session, request);
  }
  if (pathname.endsWith('/setuporganization')) {
    const url = encodeNextURL(session, request);
    return NextResponse.redirect(url);
  }
  return null;
}

// /setupdomain is a one-off step the organization form pushes to. Nothing
// enforces it — leaving never brings the user back — so it is let through as is.
function allowSetupDomain(session, request) {
  const pathname = getPathname(request.nextUrl.pathname);
  if (pathname.endsWith('/setupdomain')) {
    console.log(
      '====>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'request not redirected (setup domain)'
    );
    return nextWithSession(session, request);
  }
  return null;
}

function redirectHome(session, request) {
  const pathname = getPathname(request.nextUrl.pathname);
  const locale = getRequestLocale(session, request);
  if (pathname === '/' || pathname === `/${locale}`) {
    const url = encodeNextURL(session, request, 'todo');
    console.log(
      '====>[MIDDLEWARE]',
      request.nextUrl.pathname,
      'redirected to',
      url.pathname
    );
    return injectSession(NextResponse.redirect(url), session);
  }
  return null;
}

function getRequestLocale(session, request) {
  try {
    if (session?.account?.organization?.locale) {
      return session.account.organization.locale;
    }
    // Extract locale from URL path (first segment after basePath)
    const pathname = getPathname(request.nextUrl.pathname);
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && routing.locales.includes(segments[0])) {
      return segments[0];
    }
    return routing.defaultLocale;
  } catch (e) {
    console.error('====>[MIDDLEWARE]', e);
    return routing.defaultLocale;
  }
}

async function getSession(request) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value || '';
    if (!refreshToken) {
      return null;
    }

    const headers = {
      cookie: `refreshToken=${refreshToken}`
    };

    const response = await fetch(
      `${GATEWAY_URL}/api/v2/authenticator/landlord/session`,
      {
        headers
      }
    );

    let session = null;
    if (response.status === 200) {
      session = await response.json();
    }
    return session;
  } catch (error) {
    console.error('====>[MIDDLEWARE]', String(error));
    return null;
  }
}

function isRestrictedRequest(request) {
  const pathname = getPathname(request.nextUrl.pathname);
  const publicPathRegex =
    /\/(signin|signup|forgotpassword|resetpassword)$|\/resetpassword\/[^/]+$/;
  return !publicPathRegex.test(pathname);
}

function encodeNextURL(session, request, ...segments) {
  const aUrl = [BASE_PATH];
  if (segments.length > 0) {
    const locale = getRequestLocale(session, request);
    aUrl.push(encodeURIComponent(locale));
    segments.forEach((segment) => {
      aUrl.push(encodeURIComponent(segment));
    });
  } else {
    // When no segments, redirect to locale root
    const locale = getRequestLocale(session, request);
    aUrl.push(encodeURIComponent(locale));
  }
  let encodedUrl = aUrl.join('/') ?? '';
  if (!encodedUrl.startsWith('/')) {
    encodedUrl = `/${encodedUrl}`;
  }
  const url = new URL(encodedUrl, request.url);
  return url;
}
