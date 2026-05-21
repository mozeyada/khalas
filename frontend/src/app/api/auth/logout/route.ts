import {NextRequest, NextResponse} from 'next/server';
import {clearAuthCookies} from '../_helpers';

/**
 * POST /api/auth/logout
 *
 * Clears the HttpOnly auth cookies. The backend refresh token record is NOT
 * invalidated here because the refresh token is HttpOnly and the client
 * cannot provide it – server-side session revocation is handled when the
 * refresh token is next used and found to be mismatched.
 *
 * TODO(security): Add a server-side token revocation call to the backend
 * logout endpoint (to be implemented) so that stolen refresh tokens are
 * invalidated immediately even before their natural expiry.
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({data: null}, {status: 200});
  clearAuthCookies(response);
  return response;
}
