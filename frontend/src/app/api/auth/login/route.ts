import {NextRequest, NextResponse} from 'next/server';
import {BACKEND_URL, forwardError, setAuthCookies} from '../_helpers';

/**
 * POST /api/auth/login
 *
 * Accepts { phone, otp_code } from the client, forwards to the backend
 * verify-otp endpoint, and – on success – writes the JWT pair into
 * HttpOnly cookies so the tokens never land in JS-accessible storage.
 *
 * Returns the full AuthTokensData body (including the user profile) so the
 * SessionProvider can hydrate client state without touching the tokens.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Invalid JSON body.'}, {status: 400});
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login/verify-otp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
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
  // Return user profile only – tokens stay in HttpOnly cookies.
  const response = NextResponse.json({data: {user: tokens.user}}, {status: 200});
  setAuthCookies(response, tokens);
  return response;
}
