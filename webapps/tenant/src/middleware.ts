import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  LOCALES,
} from '@/utils/i18n/common';
import type { Locale } from '@/types';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getRequestLocale(request: NextRequest) {
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });
  const languages = new Negotiator({ headers: requestHeaders }).languages();
  return match(languages, LOCALES, DEFAULT_LOCALE) as Locale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestLocale = getRequestLocale(request);
  const pathnameLocale = getLocaleFromPathname(pathname);
  const locale = pathnameLocale || requestLocale;

  if (pathname === '/' || pathname === `/${locale}`) {
    //request.nextUrl.pathname = `/${locale}/signin`;
    request.nextUrl.pathname = `/underconstruction`;
    console.log('====>', pathname, 'redirected to', request.nextUrl.pathname);
    return NextResponse.redirect(request.nextUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-path', pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Skip all paths which do not need to be localized
    '/((?!api|_next/static|_next/image|favicon.svg).*)',
    '/',
  ],
};
