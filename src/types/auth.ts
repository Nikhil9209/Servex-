export type UserRole = 'client' | 'contractor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  role: UserRole;
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  createdAt: string;
  isPhoneVerified: boolean;
}

export interface StoredUserAccount extends User {
  passwordHash?: string; // Legacy demo seed accounts only (salted bcrypt). Supabase Auth users store zero credentials locally.
}

export interface PendingRegistration {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  passwordRaw?: string; // In-memory during registration only, never persisted
  authProvider: 'email' | 'google';
  googleSub?: string;
  googleIdToken?: string; // In-memory for Supabase Auth OAuth linking
  avatarUrl?: string;
  otpCode: string;
  otpExpiresAt: number;
  otpLastSentAt: number;
  smsDeliveryProvider?: 'twilio' | 'fast2sms' | 'simulation';
  smsDeliveryMessage?: string;
  isPhoneVerified?: boolean;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

export interface CountryCodeItem {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minLength: number;
  maxLength: number;
}

export type AuthScreenStep =
  | 'LOGIN'
  | 'REGISTER'
  | 'PHONE_COLLECT'
  | 'OTP_VERIFY'
  | 'ROLE_SELECT';
