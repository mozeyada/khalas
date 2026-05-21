import {NextRequest, NextResponse} from 'next/server';
import {BACKEND_URL, forwardError, getAccessToken} from '../../auth/_helpers';

/**
 * GET /api/proxy/[...path]
 * POST /api/proxy/[...path]
 * PUT /api/proxy/[...path]
 * PATCH /api/proxy/[...path]
 * DELETE /api/proxy/[...path]
 *
 * Generic authenticated proxy to the backend API. Reads the access token from
 * the HttpOnly cookie and forwards it as a Bearer header. The client never
 * touches the token.
 *
 * All authenticated client fetch calls should go to /api/proxy/... instead
 * of directly to the backend URL.
 */
async function handler(
  request: NextRequest,
  context: {params: {path: string[]}}
): Promise<NextResponse> {
  const token = getAccessToken(request);
  if (!token) {
    return NextResponse.json({error: 'Not authenticated.'}, {status: 401});
  }

  const backendPath = context.params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/v1/${backendPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  const contentType = request.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);

  let body: BodyInit | null = null;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  const backendRes = await fetch(url, {
    method: request.method,
    headers,
    body: body ?? undefined,
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    return forwardError(backendRes);
  }

  const responseBody = await backendRes.json();
  return NextResponse.json(responseBody, {status: backendRes.status});
}

export {handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE};
