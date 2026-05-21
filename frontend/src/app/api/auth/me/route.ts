import {NextRequest, NextResponse} from 'next/server';
import {BACKEND_URL, forwardError, getAccessToken} from '../_helpers';

/**
 * GET /api/auth/me
 *
 * Proxies GET /api/v1/auth/me using the access token from the HttpOnly cookie.
 * The client never touches the token.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getAccessToken(request);
  if (!token) {
    return NextResponse.json({error: 'Not authenticated.'}, {status: 401});
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
    headers: {Authorization: `Bearer ${token}`},
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    return forwardError(backendRes);
  }

  const payload = await backendRes.json();
  return NextResponse.json(payload, {status: 200});
}
