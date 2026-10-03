// ==============================================================================
// SERVEX CONTRACTOR PLATFORM - SECURE SERVER-SIDE SMS DISPATCH
// Supabase Edge Function: send-otp-sms
// ==============================================================================
// Server-side secrets are securely stored in Supabase Dashboard / Vault:
// - FAST2SMS_API_KEY
// - TWILIO_ACCOUNT_SID
// - TWILIO_AUTH_TOKEN
// - TWILIO_PHONE_NUMBER
//
// CRITICAL SECURITY CONTROLS:
// 1. Secrets are NEVER returned in response payloads or headers.
// 2. Secrets are NEVER logged to console or stdout.
// 3. Caller must provide valid Authorization header (Bearer token).
// 4. Fixed template only — caller cannot supply custom message text (anti-abuse / anti-relay).
// 5. Strict regex validation on phone number (10-15 digits) and OTP (exact 6 digits).
// ==============================================================================

// Ambient Deno declaration for Edge Function runtime
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface SmsRequestPayload {
  phoneNumber: string;
  countryCode: string;
  otpCode: string;
}

export interface SmsResponsePayload {
  success: boolean;
  provider: 'fast2sms' | 'twilio' | 'simulation';
  messageId?: string;
  error?: string;
}

/**
 * Validates request payload structure and types
 */
export function validateSmsPayload(body: any): { valid: boolean; error?: string; cleanPhone?: string; cleanCountry?: string; cleanOtp?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  const { phoneNumber, countryCode, otpCode } = body;

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { valid: false, error: 'Invalid phone number length (must be between 10 and 15 digits)' };
  }

  const rawCountry = typeof countryCode === 'string' && countryCode.trim() ? countryCode.trim() : '+91';
  const cleanCountry = rawCountry.startsWith('+') ? rawCountry : `+${rawCountry}`;
  if (!/^\+\d{1,4}$/.test(cleanCountry)) {
    return { valid: false, error: 'Invalid country code format (e.g. +91, +1)' };
  }

  if (!otpCode || typeof otpCode !== 'string') {
    return { valid: false, error: 'OTP code is required' };
  }

  const cleanOtp = otpCode.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: 'Invalid OTP code format (must be exactly 6 numeric digits)' };
  }

  return { valid: true, cleanPhone, cleanCountry, cleanOtp };
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Enforce HTTP POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // 1. Authorization Gate: Verify Authorization Header is present
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid Bearer token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Empty authorization token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Parse & Validate Payload
      let body: any;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validation = validateSmsPayload(body);
      if (!validation.valid || !validation.cleanPhone || !validation.cleanCountry || !validation.cleanOtp) {
        return new Response(
          JSON.stringify({ success: false, error: validation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { cleanPhone, cleanCountry, cleanOtp } = validation;
      const fullNumber = `${cleanCountry}${cleanPhone}`;
      const fixedMessage = `Your Servex verification code is ${cleanOtp}. Valid for 5 minutes. Do not share this code.`;

      // 3. Read Server-Side Secrets (NEVER bundled into mobile app)
      const fast2smsKey = Deno.env.get('FAST2SMS_API_KEY');
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

      // 4. Provider 1: Fast2SMS (Dedicated for India +91 destinations)
      if (fast2smsKey && (cleanCountry === '+91' || cleanCountry === '+091')) {
        const indianTenDigit = cleanPhone.slice(-10);
        try {
          // Attempt OTP route
          let fast2smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              authorization: fast2smsKey.trim(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'otp',
              variables_values: cleanOtp,
              numbers: indianTenDigit,
            }),
          });

          let data = await fast2smsRes.json();

          // Fallback to quick route if OTP route unavailable
          if (!data.return) {
            fast2smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
              method: 'POST',
              headers: {
                authorization: fast2smsKey.trim(),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                route: 'q',
                message: fixedMessage,
                language: 'english',
                flash: 0,
                numbers: indianTenDigit,
              }),
            });
            data = await fast2smsRes.json();
          }

          if (data.return) {
            const resPayload: SmsResponsePayload = {
              success: true,
              provider: 'fast2sms',
              messageId: data.request_id ? String(data.request_id) : undefined,
            };
            return new Response(JSON.stringify(resPayload), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            const errMsg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message || 'Fast2SMS dispatch failed');
            return new Response(
              JSON.stringify({ success: false, provider: 'fast2sms', error: errMsg }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, provider: 'fast2sms', error: err?.message || 'Fast2SMS network error' }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 5. Provider 2: Twilio (Global cellular SMS gateway)
      if (twilioSid && twilioAuth && twilioFrom) {
        try {
          const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid.trim()}/Messages.json`;
          const params = new URLSearchParams({
            To: fullNumber,
            From: twilioFrom.trim(),
            Body: fixedMessage,
          });

          const credentials = btoa(`${twilioSid.trim()}:${twilioAuth.trim()}`);
          const twilioRes = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          });

          const data = await twilioRes.json();
          if (data.sid) {
            const resPayload: SmsResponsePayload = {
              success: true,
              provider: 'twilio',
              messageId: String(data.sid),
            };
            return new Response(JSON.stringify(resPayload), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            return new Response(
              JSON.stringify({ success: false, provider: 'twilio', error: data.message || 'Twilio delivery failed' }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, provider: 'twilio', error: err?.message || 'Twilio network error' }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 6. Safe Server Simulation Mode (when neither gateway key is configured in Edge Function environment)
      const simPayload: SmsResponsePayload = {
        success: true,
        provider: 'simulation',
      };
      return new Response(JSON.stringify(simPayload), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err?.message || 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  });
}
