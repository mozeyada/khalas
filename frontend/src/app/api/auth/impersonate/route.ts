import {NextRequest, NextResponse} from 'next/server';
import {BACKEND_URL, forwardError, getAccessToken, setAuthCookies} from '../_helpers';

/**
 * POST /api/auth/impersonate
 *
 * Allows an authenticated Admin to request access/refresh tokens for another user.
 * The new tokens are set as HttpOnly cookies, replacing the admin's session.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getAccessToken(request);
  if (!token) {
    return NextResponse.json({error: 'Not authenticated.'}, {status: 401});
  }

  let body: {userId: string};
  try {
    body = (await request.json()) as {userId: string};
  } catch {
    return NextResponse.json({error: 'Invalid JSON body.'}, {status: 400});
  }

  if (!body.userId) {
    return NextResponse.json({error: 'userId is required.'}, {status: 400});
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/admin/users/${body.userId}/impersonate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
