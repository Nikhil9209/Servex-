/**
 * Servex OTP Client API Wrapper
 *
 * SECURITY BOUNDARY:
 * This module is a THIN CLIENT for the authoritative server-side OTP engine
 * (Supabase Edge Function `send-otp-sms` + Postgres challenge store).
 *
 * It contains NO security-critical authority:
 * - no OTP generation
 * - no HMAC computation
 * - no OTP secret material
 * - no local challenge/attempt/cooldown state
 * - no local verification-token issuance
 *
 * If the authoritative backend is unavailable, every call FAILS CLOSED.
 */

import { getSupabaseClient } from './supabaseClient';

export const OTP_EXPIRY_MS = 5 * 60 * 1000; // informational only (server enforces)
export const OTP_COOLDOWN_MS = 60 * 1000; // informational only (server enforces)
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_SENDS_IN_WINDOW = 5;
export const SEND_WINDOW_MS = 15 * 60 * 1000;

export interface OtpChallengeResponse {
  success: boolean;
  challengeId: string;
  expiresAt: number;
  cooldownSeconds: number;
  smsDeliveryProvider?: 'twilio' | 'fast2sms' | 'simulation';
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  verified: boolean;
  verificationToken?: string;
  remainingAttempts?: number;
  error?: string;
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // FAIL CLOSED: no in-app fallback OTP authority exists.
    throw new Error(
      'Secure verification is unavailable. Please check your connection and try again.'
    );
  }
  return supabase;
}

export const OtpService = {
  async requestOtp(phoneNumber: string, countryCode: string = '+91'): Promise<OtpChallengeResponse> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error('Please enter a valid phone number (10 to 15 digits).');
    }
    const cleanCountry = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;

    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke('send-otp-sms', {
      body: { action: 'request_otp', phoneNumber: cleanPhone, countryCode: cleanCountry },
    });

    if (error) {
      throw new Error('Unable to reach the verification service. Please try again.');
    }
    if (data && data.success && data.challengeId) {
      return {
        success: true,
        challengeId: data.challengeId,
        expiresAt: data.expiresAt || 0,
        cooldownSeconds: data.cooldownSeconds || 60,
        smsDeliveryProvider: data.provider || 'simulation',
      };
    }
    throw new Error((data && data.error) || 'Server rejected OTP request.');
  },

  async verifyOtp(challengeId: string, enteredOtp: string, expectedPhone?: string): Promise<OtpVerifyResult> {
    const cleaned = enteredOtp ? enteredOtp.trim() : '';
    if (!cleaned || !/^\d{6}$/.test(cleaned)) {
      throw new Error('Please enter the complete 6-digit verification code.');
    }
    if (!challengeId) {
      throw new Error('Verification session is invalid or missing.');
    }

    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke('send-otp-sms', {
      body: {
        action: 'verify_otp',
        challengeId,
        otpCode: cleaned,
        phoneNumber: expectedPhone ? expectedPhone.replace(/\D/g, '') : undefined,
      },
    });

    if (error) {
      throw new Error('Unable to reach the verification service. Please try again.');
    }
    if (data && data.verified && data.verificationToken) {
      return { success: true, verified: true, verificationToken: data.verificationToken };
    }
    throw new Error((data && data.error) || 'Incorrect verification code. Please try again.');
  },

  /**
   * Atomically validates + consumes a phone verification token server-side.
   * Fails closed when the authoritative backend is unreachable.
   */
  async consumeVerificationToken(phone: string, token: string): Promise<boolean> {
    if (!phone || !token) return false;
    const supabase = requireSupabase();
    try {
      const { data, error } = await supabase.rpc('verify_and_consume_phone_token', {
        p_phone: phone.replace(/\D/g, ''),
        p_token: token,
      });
      if (error) return false;
      return data === true;
    } catch {
      return false;
    }
  },
};
