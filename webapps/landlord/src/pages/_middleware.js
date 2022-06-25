import * as jose from 'jose';
import Cookies from 'universal-cookie';
import { NextResponse } from 'next/server';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

async function isRefreshTokenValid(req) {
  const cookies = new Cookies(req.headers.get('cookie'));
  const refreshToken = cookies?.get('refreshToken');

  if (!refreshToken) {
    return false;
  }
  try {
    await jose.jwtVerify(
      refreshToken,
      new TextEncoder().encode(REFRESH_TOKEN_SECRET)
    );
    return true;
  } catch (err) {
    return false;
  }
}

function redirectToSignInPage(req) {
  const signInUrl = req.nextUrl.clone();
  signInUrl.pathname = '/signin';
  return NextResponse.redirect(signInUrl);
}

function redirectToIndexPage(req) {
  const indexUrl = req.nextUrl.clone();
  indexUrl.pathname = '/';
  return NextResponse.redirect(indexUrl);
}

export async function middleware(req) {
  const page = req.page?.name;
  const isRTValid = await isRefreshTokenValid(req);
  const isRestrictedPage = page?.includes('/[organization]');
  const isSignPage = [
    '/signin',
    'signup',
    '/forgotpassword',
    '/resetpassword',
  ].some((p) => page?.includes(p));

  // Redirect / to /signin when not logged in
  if (page === '/' && !isRTValid) {
    return redirectToSignInPage(req);
  }

  // Redirect to /signin to / when logged in
  if (isSignPage && isRTValid) {
    return redirectToIndexPage(req);
  }

  // Redirect to /signin when not logged in for restricted pages
  if (isRestrictedPage && !isRTValid) {
    return redirectToSignInPage(req);
  }

  return NextResponse.next();
}
