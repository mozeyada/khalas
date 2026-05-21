import {NextRequest, NextResponse} from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
// TODO(security): Move NEXT_PUBLIC_API_BASE_URL to a server-only env var
// (without NEXT_PUBLIC_ prefix) once we confirm no client-side imports use it.

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_COOKIE = '__Host-khalas-access';
const REFRESH_COOKIE = '__Host-khalas-refresh';
// __Host- prefix requires: Secure, no Domain, Path=/
// In development (non-HTTPS) we fall back to __Secure- prefix.
// TODO(security): Switch fully to __Host- prefix once HTTPS is enforced everywhere.
const effectiveAccessCookie =
  process.env.NODE_ENV === 'production' ? ACCESS_COOKIE : 'khalas-access';
const effectiveRefreshCookie =
  process.env.NODE_ENV === 'production' ? REFRESH_COOKIE : 'khalas-refresh';

export {COOKIE_OPTIONS, effectiveAccessCookie, effectiveRefreshCookie, BACKEND_URL};

/** Read the access token from the cookie jar. */
export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get(effectiveAccessCookie)?.value;
}

/** Read the refresh token from the cookie jar. */
export function getRefreshToken(request: NextRequest): string | undefined {
  return request.cookies.get(effectiveRefreshCookie)?.value;
}

/** Set auth cookies on a response. */
export function setAuthCookies(
  response: NextResponse,
  tokens: {access_token: string; refresh_token: string; refresh_token_expires_at: string}
): void {
  response.cookies.set(effectiveAccessCookie, tokens.access_token, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes
  });
  response.cookies.set(effectiveRefreshCookie, tokens.refresh_token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/** Clear auth cookies on a response. */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(effectiveAccessCookie, '', {...COOKIE_OPTIONS, maxAge: 0});
  response.cookies.set(effectiveRefreshCookie, '', {...COOKIE_OPTIONS, maxAge: 0});
}

/** Forward a backend error response to the client. */
export async function forwardError(backendResponse: Response): Promise<NextResponse> {
  let detail = 'Request failed.';
  try {
    const body = (await backendResponse.json()) as {detail?: string};
    if (body.detail) detail = body.detail;
  } catch {
    // ignore parse errors
  }
  return NextResponse.json({error: detail}, {status: backendResponse.status});
}
