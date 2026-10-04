// ==============================================================================
// SERVEX CONTRACTOR PLATFORM - AUTHORITATIVE SERVER-SIDE OTP ENGINE
// Supabase Edge Function: send-otp-sms
// ==============================================================================
// Server-only secrets (Supabase Dashboard / Vault):
// - OTP_HMAC_SECRET          (REQUIRED - no fallback, fail closed)
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - FAST2SMS_API_KEY / TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER
//
// This function is the ONLY OTP authority:
//  - generates OTPs (CSPRNG, rejection sampling)
//  - computes OTP HMAC with OTP_HMAC_SECRET (never exposed)
//  - enforces 60s cooldown, 5 requests / 15 min per phone, 5 attempts / challenge
//  - stores challenges in phone_otp_challenges via service role
//  - issues single-use verification tokens
// ==============================================================================

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OTP_TTL_SECONDS = 300;
const COOLDOWN_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_SECONDS = 900;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL_MS = 3600000;

export function validateSmsPayload(body: any): { valid: boolean; error?: string; cleanPhone?: string; cleanCountry?: string; cleanOtp?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }
  const { phoneNumber, countryCode, otpCode } = body;
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  const cleanPhoneNum = phoneNumber.replace(/\D/g, '');
  if (cleanPhoneNum.length < 10 || cleanPhoneNum.length > 15) {
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
  return { valid: true, cleanPhone: cleanPhoneNum, cleanCountry, cleanOtp };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanPhone(phone: unknown): string {
  return typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
}

// CSPRNG 6-digit OTP with rejection sampling (no modulo bias)
export function generateSecureOtp(): string {
  const RANGE = 900000;
  const MAX_VALID = Math.floor(0xffffffff / RANGE) * RANGE;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < MAX_VALID) {
      return (100000 + (buf[0] % RANGE)).toString();
    }
  }
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface DbContext {
  url: string;
  serviceKey: string;
}

function getDbContext(): DbContext | null {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ''), serviceKey };
}

async function dbGet(ctx: DbContext, query: string): Promise<any[]> {
  const res = await fetch(`${ctx.url}/rest/v1/phone_otp_challenges?${query}`, {
    headers: { apikey: ctx.serviceKey, Authorization: `Bearer ${ctx.serviceKey}` },
  });
  if (!res.ok) throw new Error(`DB read failed (${res.status})`);
  return await res.json();
}

async function dbInsert(ctx: DbContext, row: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${ctx.url}/rest/v1/phone_otp_challenges`, {
    method: 'POST',
    headers: {
      apikey: ctx.serviceKey,
      Authorization: `Bearer ${ctx.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`DB insert failed (${res.status})`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function dbPatch(ctx: DbContext, id: string, patch: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${ctx.url}/rest/v1/phone_otp_challenges?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: ctx.serviceKey,
      Authorization: `Bearer ${ctx.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`DB update failed (${res.status})`);
}

async function dispatchSms(phone: string, countryCode: string, otp: string): Promise<string> {
  const fullNumber = `${countryCode}${phone}`;
  const message = `Your Servex verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;

  const fast2smsKey = Deno.env.get('FAST2SMS_API_KEY');
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (fast2smsKey && (countryCode === '+91' || countryCode === '+091')) {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: fast2smsKey.trim(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: phone.slice(-10),
      }),
    });
    const data = await res.json();
    if (data.return) return 'fast2sms';
    throw new Error('Fast2SMS dispatch failed');
  }

  if (twilioSid && twilioAuth && twilioFrom) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid.trim()}/Messages.json`;
    const params = new URLSearchParams({ To: fullNumber, From: twilioFrom.trim(), Body: message });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${twilioSid.trim()}:${twilioAuth.trim()}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (data.sid) return 'twilio';
    throw new Error('Twilio delivery failed');
  }

  // Neither gateway configured: simulation delivery (OTP is NOT returned)
  return 'simulation';
}

async function handleRequestOtp(body: any): Promise<Response> {
  const ctx = getDbContext();
  const hmacSecret = Deno.env.get('OTP_HMAC_SECRET');
  if (!ctx || !hmacSecret) {
    // FAIL CLOSED
    return jsonResponse({ success: false, error: 'Verification service is not configured.' }, 503);
  }

  const phone = cleanPhone(body?.phoneNumber);
  const rawCountry = typeof body?.countryCode === 'string' && body.countryCode.trim() ? body.countryCode.trim() : '+91';
  const countryCode = rawCountry.startsWith('+') ? rawCountry : `+${rawCountry}`;

  if (phone.length < 10 || phone.length > 15 || !/^\+\d{1,4}$/.test(countryCode)) {
    return jsonResponse({ success: false, error: 'Invalid phone number or country code.' }, 400);
  }

  const now = Date.now();

  // Server-side cooldown across ALL prior requests for this phone
  const recent = await dbGet(
    ctx,
    `phone=eq.${phone}&order=created_at.desc&limit=5&select=created_at`
  );
  if (recent.length > 0) {
    const last = new Date(recent[0].created_at).getTime();
    if (now - last < COOLDOWN_SECONDS * 1000) {
      const waitSec = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - last)) / 1000);
      return jsonResponse(
        { success: false, error: `Please wait ${waitSec} seconds before requesting another code.` },
        429
      );
    }
  }

  // Server-side sliding window: max 5 / 15 min
  const windowStart = new Date(now - WINDOW_SECONDS * 1000).toISOString();
  const windowRows = await dbGet(
    ctx,
    `phone=eq.${phone}&created_at=gt.${encodeURIComponent(windowStart)}&select=id`
  );
  if (windowRows.length >= MAX_REQUESTS_PER_WINDOW) {
    return jsonResponse(
      { success: false, error: 'Too many verification requests. Please try again after 15 minutes.' },
      429
    );
  }

  // Invalidate previous unverified challenges for this phone
  const active = await dbGet(
    ctx,
    `phone=eq.${phone}&verified_at=is.null&consumed_at=is.null&select=id,expires_at`
  );
  for (const row of active) {
    if (new Date(row.expires_at).getTime() > now) {
      await dbPatch(ctx, row.id, { expires_at: new Date(now - 1000).toISOString() });
    }
  }

  const otp = generateSecureOtp();
  const otpHmac = await hmacSha256Hex(hmacSecret, `${phone}:${otp}`);
  const expiresAt = new Date(now + OTP_TTL_SECONDS * 1000);

  const inserted = await dbInsert(ctx, {
    phone,
    country_code: countryCode,
    otp_hmac: otpHmac,
    expires_at: expiresAt.toISOString(),
    max_attempts: MAX_ATTEMPTS,
    attempts: 0,
    last_sent_at: new Date(now).toISOString(),
  });

  try {
    const provider = await dispatchSms(phone, countryCode, otp);
    return jsonResponse({
      success: true,
      challengeId: inserted.id,
      expiresAt: expiresAt.getTime(),
      cooldownSeconds: COOLDOWN_SECONDS,
      provider,
    });
  } catch (err: any) {
    await dbPatch(ctx, inserted.id, { expires_at: new Date(now - 1000).toISOString() });
    return jsonResponse({ success: false, error: err?.message || 'SMS dispatch failed.' }, 502);
  }
}

async function handleVerifyOtp(body: any): Promise<Response> {
  const ctx = getDbContext();
  const hmacSecret = Deno.env.get('OTP_HMAC_SECRET');
  if (!ctx || !hmacSecret) {
    return jsonResponse({ success: false, verified: false, error: 'Verification service is not configured.' }, 503);
  }

  const challengeId = typeof body?.challengeId === 'string' ? body.challengeId : '';
  const otpCode = typeof body?.otpCode === 'string' ? body.otpCode.trim() : '';
  const expectedPhone = body?.phoneNumber ? cleanPhone(body.phoneNumber) : '';

  if (!challengeId || !/^\d{6}$/.test(otpCode)) {
    return jsonResponse({ success: false, verified: false, error: 'challengeId and a 6-digit code are required.' }, 400);
  }

  const rows = await dbGet(ctx, `id=eq.${encodeURIComponent(challengeId)}&select=*`);
  const challenge = rows[0];
  if (!challenge) {
    return jsonResponse({ success: false, verified: false, error: 'Invalid or expired verification session.' }, 404);
  }

  if (expectedPhone && challenge.phone !== expectedPhone) {
    return jsonResponse({ success: false, verified: false, error: 'Challenge identity mismatch.' }, 403);
  }
  if (challenge.consumed_at || challenge.verified_at) {
    return jsonResponse({ success: false, verified: false, error: 'This verification code has already been used.' }, 409);
  }
  if (challenge.attempts >= challenge.max_attempts || challenge.locked_at) {
    return jsonResponse({ success: false, verified: false, error: 'Maximum verification attempts exceeded. Challenge locked.' }, 423);
  }
  if (Date.now() > new Date(challenge.expires_at).getTime()) {
    return jsonResponse({ success: false, verified: false, error: 'Verification code has expired.' }, 410);
  }

  const newAttempts = (challenge.attempts || 0) + 1;
  const enteredHmac = await hmacSha256Hex(hmacSecret, `${challenge.phone}:${otpCode}`);
  const match = timingSafeEqualHex(enteredHmac, challenge.otp_hmac);

  if (!match) {
    const locked = newAttempts >= challenge.max_attempts;
    await dbPatch(ctx, challenge.id, {
      attempts: newAttempts,
      ...(locked ? { locked_at: new Date().toISOString(), expires_at: new Date(Date.now() - 1000).toISOString() } : {}),
    });
    if (locked) {
      return jsonResponse({ success: false, verified: false, error: 'Maximum verification attempts exceeded. Challenge locked.' }, 423);
    }
    return jsonResponse({
      success: false,
      verified: false,
      error: `Incorrect verification code. Please try again. (${challenge.max_attempts - newAttempts} attempts remaining)`,
      remainingAttempts: challenge.max_attempts - newAttempts,
    });
  }

  const token = randomHex(32);
  await dbPatch(ctx, challenge.id, {
    attempts: newAttempts,
    verified_at: new Date().toISOString(),
    verification_token: token,
  });

  return jsonResponse({ success: true, verified: true, verificationToken: token });
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed. Use POST.' }, 405);
    }

    try {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }

      let body: any;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ success: false, error: 'Invalid JSON payload' }, 400);
      }

      if (body?.action === 'request_otp') {
        return await handleRequestOtp(body);
      }
      if (body?.action === 'verify_otp') {
        return await handleVerifyOtp(body);
      }
      return jsonResponse({ success: false, error: 'Unknown action' }, 400);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Internal server error' }, 500);
    }
  });
}
