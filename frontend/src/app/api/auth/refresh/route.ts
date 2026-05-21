import {NextRequest, NextResponse} from 'next/server';
import {BACKEND_URL, forwardError, getRefreshToken, setAuthCookies} from '../_helpers';

/**
 * POST /api/auth/refresh
 *
 * Reads the refresh token from the HttpOnly cookie, forwards it to the backend
 * rotation endpoint, and writes the new token pair back into HttpOnly cookies.
 * Returns the updated user profile.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = getRefreshToken(request);
  if (!refreshToken) {
    return NextResponse.json({error: 'No refresh token.'}, {status: 401});
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({refresh_token: refreshToken}),
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    return forwardError(backendRes);
  }

  const payload = (await backendRes.json()) as {
    data: {
      access_token: string;
      refresh_token: string;
      refresh_token_expires_at: string;
      user: unknown;
    };
  };

  const tokens = payload.data;
  const response = NextResponse.json({data: {user: tokens.user}}, {status: 200});
  setAuthCookies(response, tokens);
  return response;
}
