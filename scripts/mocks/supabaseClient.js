/**
 * TEST-ONLY Supabase client mock.
 * Remapped into place by the test runners via Module._resolveFilename.
 *
 * Simulates the authoritative server OTP engine (Edge Function +
 * verify_and_consume_phone_token RPC) in-memory so tests can exercise the
 * REAL client↔server contract without network access.
 *
 * NOT bundled into the app. Production code fails closed when no backend exists.
 */
const crypto = require('crypto');

const challenges = new Map(); // id -> challenge record
const phoneIndex = []; // all records (ordered)
let idCounter = 0;

const OTP_TTL_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const TEST_SECRET = 'test-only-hmac-secret';

function hmac(phone, otp) {
  return crypto.createHmac('sha256', TEST_SECRET).update(`${phone}:${otp}`).digest('hex');
}

function randomHex(n) {
  return crypto.randomBytes(n).toString('hex');
}

function reset() {
  challenges.clear();
  phoneIndex.length = 0;
  idCounter = 0;
}

function requestOtp(phone, countryCode) {
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10 || clean.length > 15) {
    return { success: false, error: 'Invalid phone number length (must be between 10 and 15 digits)' };
  }
  const now = Date.now();
  const forPhone = phoneIndex.filter((c) => c.phone === clean);
  if (forPhone.length > 0) {
    const last = Math.max(...forPhone.map((c) => c.createdAt));
    if (now - last < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
      return { success: false, error: `Please wait ${waitSec} seconds before requesting another code.` };
    }
  }
  const inWindow = forPhone.filter((c) => now - c.createdAt < WINDOW_MS);
  if (inWindow.length >= MAX_REQUESTS) {
    return { success: false, error: 'Too many verification requests for this phone number. Please try again after 15 minutes.' };
  }
  // Invalidate previous active challenges
  for (const c of forPhone) {
    if (!c.verifiedAt && !c.consumedAt && c.expiresAt > now) {
      c.expiresAt = now - 1;
    }
  }
  // CSPRNG OTP with rejection sampling
  let otp;
  do {
    const buf = crypto.randomBytes(4).readUInt32BE(0);
    if (buf < Math.floor(0xffffffff / 900000) * 900000) {
      otp = (100000 + (buf % 900000)).toString();
    }
  } while (!otp);

  const id = `mock-${++idCounter}-${randomHex(8)}`;
  const record = {
    id,
    phone: clean,
    countryCode,
    otpHmac: hmac(clean, otp),
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    verifiedAt: undefined,
    consumedAt: undefined,
    lockedAt: undefined,
    verificationToken: undefined,
    deliveredOtp: otp, // test-only: simulates SMS delivery
  };
  challenges.set(id, record);
  phoneIndex.push(record);
  return {
    success: true,
    challengeId: id,
    expiresAt: record.expiresAt,
    cooldownSeconds: 60,
    provider: 'simulation',
  };
}

function verifyOtp(challengeId, otpCode, expectedPhone) {
  const challenge = challenges.get(challengeId);
  if (!challenge) {
    return { success: false, verified: false, error: 'Invalid or expired verification session.' };
  }
  if (expectedPhone && challenge.phone !== String(expectedPhone).replace(/\D/g, '')) {
    return { success: false, verified: false, error: 'Challenge identity mismatch: This code was not requested for this phone number.' };
  }
  if (challenge.consumedAt || challenge.verifiedAt) {
    return { success: false, verified: false, error: 'This verification code has already been used.' };
  }
  if (challenge.attempts >= challenge.maxAttempts || challenge.lockedAt) {
    return { success: false, verified: false, error: 'Maximum verification attempts exceeded. Challenge locked.' };
  }
  if (Date.now() > challenge.expiresAt) {
    return { success: false, verified: false, error: 'Verification code has expired. Please request a new code.' };
  }
  challenge.attempts += 1;
  const match = hmac(challenge.phone, otpCode) === challenge.otpHmac;
  if (!match) {
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.lockedAt = Date.now();
      challenge.expiresAt = Date.now() - 1;
      return { success: false, verified: false, error: 'Maximum verification attempts exceeded. Challenge locked.' };
    }
    return {
      success: false,
      verified: false,
      error: `Incorrect verification code. Please try again. (${challenge.maxAttempts - challenge.attempts} attempts remaining)`,
      remainingAttempts: challenge.maxAttempts - challenge.attempts,
    };
  }
  const token = randomHex(32);
  challenge.verifiedAt = Date.now();
  challenge.verificationToken = token;
  return { success: true, verified: true, verificationToken: token };
}

function consumeToken(phone, token) {
  const clean = String(phone || '').replace(/\D/g, '');
  const found = phoneIndex.find(
    (c) => c.verificationToken === token && c.phone === clean && c.verifiedAt && !c.consumedAt
  );
  if (!found) return false;
  if (Date.now() - found.verifiedAt > 3600000) return false;
  found.consumedAt = Date.now();
  return true;
}

const recoveryRequests = [];
const updatedPasswords = [];
const authListeners = new Set();
let mockSession = null;

const mockClient = {
  functions: {
    invoke: async (name, { body } = {}) => {
      if (name !== 'send-otp-sms') return { data: null, error: new Error('unknown function') };
      if (body && body.action === 'request_otp') {
        const result = requestOtp(body.phoneNumber, body.countryCode || '+91');
        if (!result.success) return { data: result, error: null };
        return { data: result, error: null };
      }
      if (body && body.action === 'verify_otp') {
        const result = verifyOtp(body.challengeId, body.otpCode, body.phoneNumber);
        return { data: result, error: null };
      }
      return { data: { success: false, error: 'Unknown action' }, error: null };
    },
  },
  rpc: async (fnName, args = {}) => {
    if (fnName === 'verify_and_consume_phone_token') {
      return { data: consumeToken(args.p_phone, args.p_token), error: null };
    }
    if (fnName === 'complete_user_onboarding') {
      if (!args.p_verification_token || String(args.p_verification_token).length < 32) {
        return { data: null, error: new Error('Phone verification token is mandatory for account onboarding') };
      }
      if (!consumeToken(args.p_phone, args.p_verification_token)) {
        return { data: null, error: new Error('Invalid, expired, or already consumed phone verification token.') };
      }
      return { data: args.p_role, error: null };
    }
    return { data: null, error: new Error('unknown rpc') };
  },
  auth: {
    signUp: async () => ({ data: {}, error: new Error('Network unavailable (mock offline)') }),
    signInWithPassword: async () => ({ data: {}, error: new Error('Network unavailable (mock offline)') }),
    signInWithIdToken: async () => ({ data: {}, error: new Error('Network unavailable (mock offline)') }),
    signOut: async () => {
      mockSession = null;
      for (const cb of authListeners) cb('SIGNED_OUT', null);
      return { error: null };
    },
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    getUser: async () => ({ data: { user: mockSession?.user || null }, error: null }),
    resetPasswordForEmail: async (email, options = {}) => {
      if (!email || !email.includes('@')) {
        return { data: null, error: new Error('Unable to validate email address: invalid format') };
      }
      recoveryRequests.push({ email, options, createdAt: Date.now() });
      return { data: {}, error: null };
    },
    updateUser: async ({ password } = {}) => {
      if (!password || password.length < 8) {
        return { data: null, error: new Error('Password should be at least 8 characters') };
      }
      updatedPasswords.push(password);
      return { data: { user: { id: 'mock-user-id', email: 'user@example.com' } }, error: null };
    },
    exchangeCodeForSession: async (code) => {
      if (!code || code === 'expired_code' || code === 'invalid_code') {
        return { data: { session: null, user: null }, error: new Error('Invalid or expired PKCE authorization code') };
      }
      mockSession = {
        access_token: `mock_tok_${code}`,
        refresh_token: `mock_ref_${code}`,
        user: { id: 'mock-recovery-user-id', email: 'user@servex.com' },
      };
      for (const cb of authListeners) cb('PASSWORD_RECOVERY', mockSession);
      return { data: { session: mockSession, user: mockSession.user }, error: null };
    },
    setSession: async ({ access_token, refresh_token } = {}) => {
      if (!access_token || access_token.includes('expired') || access_token.includes('invalid')) {
        return { data: { session: null, user: null }, error: new Error('Invalid or expired session token') };
      }
      mockSession = {
        access_token,
        refresh_token,
        user: { id: 'mock-recovery-user-id', email: 'user@servex.com' },
      };
      for (const cb of authListeners) cb('PASSWORD_RECOVERY', mockSession);
      return { data: { session: mockSession, user: mockSession.user }, error: null };
    },
    onAuthStateChange: (callback) => {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },
  from: (_table) => {
    const chain = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'maybeSingle' || prop === 'single') {
            return async () => ({ data: null, error: null });
          }
          if (prop === 'then') {
            return (resolve) => resolve({ data: null, error: null });
          }
          return (..._args) => chain;
        },
      }
    );
    return chain;
  },
};

module.exports = {
  getSupabaseClient: () => mockClient,
  isSupabaseConfigured: () => false,
  getSupabaseSession: async () => mockSession,
  getSupabaseAuthUser: async () => mockSession?.user || null,
  // ---- test helpers (not part of the real module) ----
  __resetOtpMock: () => {
    reset();
    recoveryRequests.length = 0;
    updatedPasswords.length = 0;
    mockSession = null;
    authListeners.clear();
  },
  __getRecoveryRequests: () => [...recoveryRequests],
  __getUpdatedPasswords: () => [...updatedPasswords],
  __triggerAuthStateChange: (event, session) => {
    for (const cb of authListeners) cb(event, session);
  },
  __getSimulatedDeliveredOtp: (challengeId) => {
    const c = challenges.get(challengeId);
    return c ? c.deliveredOtp : null;
  },
  __issueTestVerificationToken: (phone) => {
    const clean = String(phone).replace(/\D/g, '');
    const token = randomHex(32);
    const id = `mock-test-${++idCounter}`;
    const rec = {
      id,
      phone: clean,
      countryCode: '+91',
      otpHmac: 'test',
      createdAt: Date.now(),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      verifiedAt: Date.now(),
      verificationToken: token,
    };
    challenges.set(id, rec);
    phoneIndex.push(rec);
    return token;
  },
};
