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

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

type FetchOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store'
  });

  const payload = (await response.json()) as ApiResponse<T> | {detail?: string};

  if (!response.ok) {
    const message = 'detail' in payload && payload.detail ? payload.detail : 'Request failed.';
    throw new ApiError(message, response.status);
  }

  return (payload as ApiResponse<T>).data as T;
}

export async function getPublicVenue(slug: string): Promise<PublicVenue> {
  return apiFetch<PublicVenue>(`/api/v1/venues/${slug}`);
}

export async function getVenueStaff(slug: string): Promise<PublicStaff[]> {
  return apiFetch<PublicStaff[]>(`/api/v1/venues/${slug}/staff`);
}

export async function getStaffProfile(staffId: string): Promise<PublicStaff> {
  return apiFetch<PublicStaff>(`/api/v1/staff/${staffId}`);
}

export async function getStaffServices(staffId: string): Promise<PublicService[]> {
  return apiFetch<PublicService[]>(`/api/v1/staff/${staffId}/services`);
}

export async function getStaffSlots(staffId: string, serviceId: string): Promise<SlotAvailability> {
  return apiFetch<SlotAvailability>(
    `/api/v1/staff/${staffId}/slots?service_id=${encodeURIComponent(serviceId)}`
  );
}

export async function registerPatient(input: {
  phone: string;
  name_ar: string;
  name_en: string;
  email?: string;
}): Promise<OtpChallengeData> {
  return apiFetch<OtpChallengeData>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({...input, role: 'patient'})
  });
}

export async function requestLoginOtp(phone: string): Promise<OtpChallengeData> {
  return apiFetch<OtpChallengeData>('/api/v1/auth/login/request-otp', {
    method: 'POST',
    body: JSON.stringify({phone})
  });
}

export async function verifyOtp(phone: string, otpCode: string): Promise<AuthTokensData> {
  return apiFetch<AuthTokensData>('/api/v1/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({phone, otp_code: otpCode})
  });
}

export async function refreshSession(refreshToken: string): Promise<AuthTokensData> {
  return apiFetch<AuthTokensData>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({refresh_token: refreshToken})
  });
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/v1/auth/me', {token});
}

export async function createAppointment(
  token: string,
  input: {service_id: string; slot_datetime: string; notes?: string}
): Promise<Appointment> {
  return apiFetch<Appointment>('/api/v1/appointments', {
    method: 'POST',
    token,
    body: JSON.stringify(input)
  });
}

export async function getMyAppointments(token: string): Promise<Appointment[]> {
  return apiFetch<Appointment[]>('/api/v1/appointments/mine', {token});
}

export async function cancelAppointment(
  token: string,
  appointmentId: string,
  cancellationReason?: string
): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    token,
    body: JSON.stringify({cancellation_reason: cancellationReason})
  });
}

export async function getProviderAppointments(token: string): Promise<Appointment[]> {
  return apiFetch<Appointment[]>('/api/v1/provider/appointments', {token});
}

export async function updateProviderAppointmentStatus(
  token: string,
  appointmentId: string,
  input: {status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'; cancellation_reason?: string}
): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/v1/provider/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input)
  });
}
