import {
  ApiResponse,
  Appointment,
  AuthTokensData,
  OtpChallengeData,
  PublicService,
  PublicStaff,
  PublicVenue,
  SlotAvailability,
  UserProfile
} from '@/lib/types';

/**
 * Public (unauthenticated) backend base URL.
 * Used only for public endpoints that don't require an auth token.
 */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// ── Internal fetch helpers ────────────────────────────────────────────────────

type FetchOptions = RequestInit;

async function publicFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  /**
   * Unauthenticated fetch to the backend (public endpoints only).
   * Does NOT attach any token – tokens are in HttpOnly cookies managed by
   * the BFF routes and are never accessed here.
   */
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
  });

  const payload = (await response.json()) as ApiResponse<T> | {detail?: string};

  if (!response.ok) {
    let message = 'Request failed.';
    if ('detail' in payload && payload.detail) {
      if (Array.isArray(payload.detail)) {
        // FastAPI validation error array
        message = payload.detail.map((err: any) => `${err.loc?.join('.')} ${err.msg}`).join(', ');
      } else if (typeof payload.detail === 'string') {
        message = payload.detail;
      }
    }
    throw new ApiError(message, response.status);
  }

  return (payload as ApiResponse<T>).data as T;
}

async function bffFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  /**
   * Authenticated fetch through the BFF proxy at /api/proxy/...
   *
   * The BFF route reads the HttpOnly access token cookie and forwards it to
   * the backend. This function never touches any token.
   */
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Strip the /api/v1/ prefix – the proxy route adds it back.
  const proxyPath = path.replace(/^\/api\/v1\//, '');
  const response = await fetch(`/api/proxy/${proxyPath}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const payload = (await response.json()) as ApiResponse<T> | {error?: string};

  if (!response.ok) {
    const message =
      'error' in payload && payload.error
        ? payload.error
        : 'detail' in payload && (payload as {detail?: string}).detail
          ? (payload as {detail?: string}).detail!
          : 'Request failed.';
    throw new ApiError(message, response.status);
  }

  return (payload as ApiResponse<T>).data as T;
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function getPublicVenue(slug: string): Promise<PublicVenue> {
  return publicFetch<PublicVenue>(`/api/v1/venues/${slug}`);
}

export async function getVenueStaff(slug: string): Promise<PublicStaff[]> {
  return publicFetch<PublicStaff[]>(`/api/v1/venues/${slug}/staff`);
}

export async function getStaffProfile(staffId: string): Promise<PublicStaff> {
  return publicFetch<PublicStaff>(`/api/v1/staff/${staffId}`);
}

export async function getStaffServices(staffId: string): Promise<PublicService[]> {
  return publicFetch<PublicService[]>(`/api/v1/staff/${staffId}/services`);
}

export async function getStaffSlots(staffId: string, serviceId: string): Promise<SlotAvailability> {
  return publicFetch<SlotAvailability>(
    `/api/v1/staff/${staffId}/slots?service_id=${encodeURIComponent(serviceId)}`
  );
}

// ── Auth flows (unauthenticated – OTP issuance only) ─────────────────────────
// OTP verification (login) goes through /api/auth/login (BFF route) in
// session-provider.tsx to keep the token out of client code entirely.

export async function registerPatient(input: {
  phone: string;
  name_ar: string;
  name_en: string;
  email: string;
}): Promise<OtpChallengeData> {
  return publicFetch<OtpChallengeData>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({...input, role: 'patient'}),
  });
}

export async function requestLoginOtp(phone: string): Promise<OtpChallengeData> {
  return publicFetch<OtpChallengeData>('/api/v1/auth/login/request-otp', {
    method: 'POST',
    body: JSON.stringify({phone}),
  });
}

// ── Authenticated endpoints (routed through BFF proxy) ───────────────────────

export async function getCurrentUser(): Promise<UserProfile> {
  return bffFetch<UserProfile>('/api/v1/auth/me');
}

export async function createAppointment(
  input: {service_id: string; slot_datetime: string; notes?: string}
): Promise<Appointment> {
  return bffFetch<Appointment>('/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getMyAppointments(): Promise<Appointment[]> {
  return bffFetch<Appointment[]>('/api/v1/appointments/mine');
}

export async function cancelAppointment(
  appointmentId: string,
  cancellationReason?: string
): Promise<Appointment> {
  return bffFetch<Appointment>(`/api/v1/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({cancellation_reason: cancellationReason}),
  });
}

export async function getProviderAppointments(): Promise<Appointment[]> {
  return bffFetch<Appointment[]>('/api/v1/provider/appointments');
}

export async function updateProviderAppointmentStatus(
  appointmentId: string,
  input: {status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'; cancellation_reason?: string}
): Promise<Appointment> {
  return bffFetch<Appointment>(`/api/v1/provider/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// Legacy compatibility – these were accepting explicit tokens before BFF.
// Kept as re-exports with the same shape so callers don't need updating yet.
// TODO: Remove the token parameter from all call sites.
export async function verifyOtp(_phone: string, _otpCode: string): Promise<AuthTokensData> {
  throw new Error('Use session.verifyOtpCode() instead – tokens are managed by the BFF.');
}

export async function refreshSession(_refreshToken: string): Promise<AuthTokensData> {
  throw new Error('Use session.refresh() instead – tokens are managed by the BFF.');
}
