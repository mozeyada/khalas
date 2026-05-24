export type Role = 'patient' | 'provider' | 'admin' | 'salesman';

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type UserProfile = {
  _id: string;
  phone: string;
  email: string | null;
  name_ar: string;
  name_en: string;
  role: Role;
  is_active: boolean;
  preferred_channel: 'email' | 'whatsapp';
  created_at: string;
  updated_at: string;
};

export type OtpChallengeData = {
  identifier: string;
  otp_expires_at: string;
  role: Role;
};

export type AuthTokensData = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user: UserProfile;
};

export type PublicVenue = {
  _id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  category: string;
  description_ar: string | null;
  description_en: string | null;
  governorate: string;
  area: string;
  address_ar: string;
  address_en: string;
  phone: string;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  photos: string[];
};

export type PublicStaff = {
  _id: string;
  venue_id: string;
  name_ar: string;
  name_en: string;
  title_ar: string | null;
  title_en: string | null;
  specialty_ar: string | null;
  specialty_en: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  photo_url: string | null;
};

export type PublicService = {
  _id: string;
  staff_id: string;
  venue_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  category: string;
};

export type Slot = {
  slot_datetime: string;
  slot_datetime_cairo: string;
  duration_minutes: number;
  buffer_minutes: number;
};

export type SlotAvailability = {
  staff_id: string;
  service_id: string;
  date_from: string;
  date_to: string;
  slots: Slot[];
};

export type Appointment = {
  _id: string;
  venue_id: string;
  staff_id: string;
  service_id: string;
  patient_id: string;
  slot_datetime: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_method: 'cash';
  payment_status: 'unpaid';
  deposit_amount: number | null;
  price_at_booking: number;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: 'patient' | 'staff' | 'admin' | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
};
