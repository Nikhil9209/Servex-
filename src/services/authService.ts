import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  AuthSession as AppAuthSession,
  PendingRegistration,
  StoredUserAccount,
  User,
  UserRole,
} from '../types/auth';
import { StorageService } from './storage';
import { OtpService } from './otpService';
import { getSupabaseClient } from './supabaseClient';
import { getSecureRandomBytes } from '../utils/projectCodeGenerator';
import bcrypt from 'bcryptjs';

WebBrowser.maybeCompleteAuthSession();

/**
 * Bcrypt password verification helper for legacy seed accounts and offline mode.
 * Supabase Auth is the authority for password authentication.
 * Plaintext passwords and fast general-purpose hashes (SHA-256/MD5/SHA-1) are strictly prohibited.
 */
function verifyLocalBcryptPassword(passwordRaw: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  try {
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      return bcrypt.compareSync(passwordRaw, storedHash);
    }
  } catch {
    // Ignore error
  }
  return false;
}

function generateUuid(): string {
  const bytes = getSecureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function generateSessionToken(prefix: string = 'srvx_sess_'): string {
  const bytes = getSecureRandomBytes(16);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `${prefix}${Date.now()}_${hex}`;
}

// Google OAuth Discovery Endpoints
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
};

export interface GoogleAuthResult {
  status: 'AUTHENTICATED' | 'NEEDS_PHONE' | 'CANCELLED' | 'ERROR';
  user?: User;
  session?: AppAuthSession;
  pendingUser?: PendingRegistration;
  errorMessage?: string;
}

export const AuthService = {
  /**
   * Validates email syntax
   */
  isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(trimmed);
  },

  /**
   * Validates phone number format
   */
  isValidPhone(phone: string, minLength: number = 10, maxLength: number = 10): boolean {
    const cleanDigits = phone.replace(/\D/g, '');
    return cleanDigits.length >= minLength && cleanDigits.length <= maxLength;
  },

  /**
   * Formats a phone number for display (+91 XXXXX XXXXX)
   */
  formatPhoneForDisplay(phone: string, countryCode: string): string {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length === 10) {
      return `${countryCode} ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
    }
    return `${countryCode} ${cleanDigits}`;
  },

  /**
   * Check if email is already registered
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    const users = await StorageService.getRegisteredUsers();
    return users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  },

  /**
   * Check if phone number is already registered
   */
  async isPhoneRegistered(phone: string, countryCode: string): Promise<boolean> {
    const cleanDigits = phone.replace(/\D/g, '');
    const users = await StorageService.getRegisteredUsers();
    return users.some(
      (u) =>
        u.phone.replace(/\D/g, '') === cleanDigits &&
        (u.countryCode === countryCode || !u.countryCode)
    );
  },

  /**
   * Email + Password Login
   */
  async loginWithEmail(
    emailRaw: string,
    passwordRaw: string
  ): Promise<{ user: User; session: AppAuthSession }> {
    const email = emailRaw.trim().toLowerCase();
    const password = passwordRaw;

    if (!email) {
      throw new Error('Please enter your email address.');
    }
    if (!this.isValidEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const users = await StorageService.getRegisteredUsers();
    let foundUser = users.find((u) => u.email.toLowerCase() === email);

    // Supabase Auth is the primary authentication authority
    const supabase = getSupabaseClient();
    let supabaseUid: string | null = null;

    if (supabase) {
      try {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError && authData?.user) {
          supabaseUid = authData.user.id;
        } else if (signInError) {
          // Check if this is a legacy seed account awaiting migration to Supabase Auth
          if (foundUser?.passwordHash) {
            const isBcryptValid = verifyLocalBcryptPassword(password, foundUser.passwordHash);
            if (!isBcryptValid) {
              throw new Error('Incorrect password. Please verify your credentials and try again.');
            }

            // Valid legacy credentials: migrate user into Supabase Auth
            try {
              const { data: signUpData } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    name: foundUser.name,
                    phone: foundUser.phone,
                    role: foundUser.role,
                  },
                },
              });
              if (signUpData?.user) {
                supabaseUid = signUpData.user.id;
              }
            } catch {
              // Ignore migration network/rate-limit error
            }
          } else if (!foundUser) {
            throw new Error('An account with this email was not found. Please create an account.');
          } else {
            // Password invalid in Supabase Auth
            throw new Error('Incorrect password. Please verify your credentials and try again.');
          }
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('Incorrect password') || err.message.includes('not found'))) {
          throw err;
        }
        // Network failure / offline fallback for legacy accounts
        if (foundUser?.passwordHash) {
          const isBcryptValid = verifyLocalBcryptPassword(password, foundUser.passwordHash);
          if (!isBcryptValid) {
            throw new Error('Incorrect password. Please verify your credentials and try again.');
          }
        } else if (!foundUser) {
          throw new Error('An account with this email was not found. Please create an account.');
        }
      }
    } else {
      // Local/offline test mode without Supabase client
      if (!foundUser) {
        throw new Error('An account with this email was not found. Please create an account.');
      }
      if (foundUser.passwordHash) {
        const isBcryptValid = verifyLocalBcryptPassword(password, foundUser.passwordHash);
        if (!isBcryptValid) {
          throw new Error('Incorrect password. Please verify your credentials and try again.');
        }
      }
    }

    if (!foundUser) {
      throw new Error('An account with this email was not found. Please create an account.');
    }

    if (supabaseUid && foundUser.id !== supabaseUid) {
      foundUser.id = supabaseUid;
      const userIndex = users.findIndex((u) => u.email.toLowerCase() === email);
      if (userIndex >= 0) {
        users[userIndex].id = supabaseUid;
        await StorageService.saveRegisteredUsers(users);
      }
    }

    // Sync server-authoritative role from user_roles table if connected
    if (supabase && supabaseUid) {
      try {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', supabaseUid)
          .maybeSingle();

        if (roleRow?.role && (roleRow.role === 'contractor' || roleRow.role === 'client')) {
          foundUser.role = roleRow.role;
        }
      } catch {
        // Non-blocking
      }
    }

    // Prepare session
    const session: AppAuthSession = {
      token: generateSessionToken('srvx_sess_'),
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        countryCode: foundUser.countryCode,
        role: foundUser.role,
        avatarUrl: foundUser.avatarUrl,
        authProvider: foundUser.authProvider,
        createdAt: foundUser.createdAt,
        isPhoneVerified: foundUser.isPhoneVerified,
      },
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    await StorageService.saveSession(session);
    return { user: session.user, session };
  },

  /**
   * Processes a verified Google user profile and routes to either:
   * - Flow C: Existing Servex Account -> Logs in immediately
   * - Flow B: First-time Google User -> Mandatory Phone Number collection
   */
  async processGoogleIdentity(
    googleUser: {
      name: string;
      email: string;
      sub: string;
      picture?: string;
    },
    googleIdToken?: string
  ): Promise<GoogleAuthResult> {
    const supabase = getSupabaseClient();
    let supabaseUid: string | null = null;
    if (supabase && googleIdToken) {
      try {
        const { data: oauthData } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleIdToken,
        });
        if (oauthData?.user) {
          supabaseUid = oauthData.user.id;
        }
      } catch {
        // Safe offline / dashboard config fallback
      }
    }

    // 1. Check if user already exists in Servex database
    const existingUsers = await StorageService.getRegisteredUsers();
    const existingAccount = existingUsers.find(
      (u) =>
        u.email.toLowerCase() === googleUser.email.toLowerCase() ||
        (u.authProvider === 'google' && u.email.toLowerCase() === googleUser.email.toLowerCase())
    );

    // Flow C: Existing Google user with assigned role (whether phone was verified or skipped for later)
    if (existingAccount && existingAccount.role) {
      if (supabase && supabaseUid) {
        try {
          const { data: roleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', supabaseUid)
            .maybeSingle();

          if (roleRow?.role && (roleRow.role === 'contractor' || roleRow.role === 'client')) {
            existingAccount.role = roleRow.role;
          }
        } catch {
          // Non-blocking
        }
      }

      if (supabaseUid && existingAccount.id !== supabaseUid) {
        existingAccount.id = supabaseUid;
        const userIdx = existingUsers.findIndex(
          (u) => u.email.toLowerCase() === googleUser.email.toLowerCase()
        );
        if (userIdx >= 0) {
          existingUsers[userIdx].id = supabaseUid;
          await StorageService.saveRegisteredUsers(existingUsers);
        }
      }

      const session: AppAuthSession = {
        token: generateSessionToken('srvx_sess_g_'),
        user: {
          id: existingAccount.id,
          name: existingAccount.name || googleUser.name,
          email: existingAccount.email,
          phone: existingAccount.phone,
          countryCode: existingAccount.countryCode || '+91',
          role: existingAccount.role,
          avatarUrl: googleUser.picture || existingAccount.avatarUrl,
          authProvider: 'google',
          createdAt: existingAccount.createdAt,
          isPhoneVerified: Boolean(existingAccount.isPhoneVerified),
        },
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      await StorageService.saveSession(session);
      return { status: 'AUTHENTICATED', user: session.user, session };
    }

    // Flow B: First-time Google user -> Needs mandatory phone number & verification
    const pending: PendingRegistration = {
      name: googleUser.name,
      email: googleUser.email.toLowerCase(),
      phone: '',
      countryCode: '+91',
      authProvider: 'google',
      googleSub: googleUser.sub,
      googleIdToken,
      avatarUrl: googleUser.picture,
      otpExpiresAt: 0,
      otpLastSentAt: 0,
    };

    return { status: 'NEEDS_PHONE', pendingUser: pending };
  },

  /**
   * Helper to parse access_token from return URL hash or query params
   */
  extractTokenFromUrl(url: string): string | null {
    // 1. Check hash fragment (#access_token=...)
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      if (token) return token;
    }
    // 2. Check query fragment (?access_token=...)
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const query = url.substring(queryIndex + 1);
      const params = new URLSearchParams(query);
      const token = params.get('access_token');
      if (token) return token;
    }
    return null;
  },

  /**
   * Helper to parse id_token from return URL hash or query params
   */
  extractIdTokenFromUrl(url: string): string | null {
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const token = params.get('id_token');
      if (token) return token;
    }
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const query = url.substring(queryIndex + 1);
      const params = new URLSearchParams(query);
      const token = params.get('id_token');
      if (token) return token;
    }
    return null;
  },

  /**
   * Fetches user profile from Google and routes to Servex identity processor
   */
  async fetchAndProcessGoogleUser(
    accessToken: string,
    idToken?: string
  ): Promise<GoogleAuthResult> {
    const userInfoResponse = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userInfoResponse.ok) {
      const profile = await userInfoResponse.json();
      return this.processGoogleIdentity(
        {
          name: profile.name || 'Google User',
          email: profile.email,
          sub: profile.sub,
          picture: profile.picture,
        },
        idToken
      );
    } else {
      return {
        status: 'ERROR',
        errorMessage: 'Failed to retrieve profile from Google. Please try again.',
      };
    }
  },

  /**
   * Official Google OAuth Sign-In flow
   * Launches Google's official accounts login via browser / In-App Browser tab
   * Seamlessly bridges Expo Go requests through the authorized Expo Proxy
   */
  async signInWithGoogle(): Promise<GoogleAuthResult> {
    const customClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    // Check if client ID is configured
    if (!customClientId || customClientId.trim() === '' || customClientId.includes('placeholder')) {
      return {
        status: 'ERROR',
        errorMessage:
          'Google Cloud OAuth Client ID is required to open official Google Login.\nPlease paste your Google Client ID into .env as EXPO_PUBLIC_GOOGLE_CLIENT_ID.',
      };
    }

    const cleanClientId = customClientId.trim();

    try {
      if (Platform.OS === 'web') {
        const redirectUri = AuthSession.makeRedirectUri();
        console.log('>>> [Servex Google OAuth] Web redirect URI:', redirectUri);
        const request = new AuthSession.AuthRequest({
          clientId: cleanClientId,
          scopes: ['openid', 'profile', 'email'],
          redirectUri,
          responseType: AuthSession.ResponseType.Token,
          prompt: AuthSession.Prompt.SelectAccount,
        });

        const result = await request.promptAsync(GOOGLE_DISCOVERY);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          return { status: 'CANCELLED' };
        }
        if (result.type === 'success' && result.params?.access_token) {
          return await this.fetchAndProcessGoogleUser(
            result.params.access_token,
            result.params.id_token
          );
        }
      } else {
        // Native / Expo Go: Google strictly forbids exp:// custom schemes in Web OAuth clients.
        // Route through authorized Expo Auth Proxy (https://auth.expo.io/@nikhil9209/servex-contractor)
        // which Google accepts as valid HTTPS, and auth.expo.io deep-links the token back to your phone.
        const proxyRedirectUri = 'https://auth.expo.io/@nikhil9209/servex-contractor';
        const returnUrl = AuthSession.makeRedirectUri({ scheme: 'servex-contractor' });

        const googleAuthUrl =
          `${GOOGLE_DISCOVERY.authorizationEndpoint}?` +
          `client_id=${encodeURIComponent(cleanClientId)}&` +
          `redirect_uri=${encodeURIComponent(proxyRedirectUri)}&` +
          `response_type=token&` +
          `scope=${encodeURIComponent('openid profile email')}&` +
          `prompt=select_account`;

        const startUrl =
          `https://auth.expo.io/@nikhil9209/servex-contractor/start?` +
          `authUrl=${encodeURIComponent(googleAuthUrl)}&` +
          `returnUrl=${encodeURIComponent(returnUrl)}`;

        console.log('>>> [Servex Google OAuth] Opening official Google Auth via proxy...');
        const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

        if (result.type === 'cancel' || result.type === 'dismiss') {
          return { status: 'CANCELLED' };
        }

        if (result.type === 'success' && result.url) {
          const token = this.extractTokenFromUrl(result.url);
          const idToken = this.extractIdTokenFromUrl(result.url);
          if (token) {
            return await this.fetchAndProcessGoogleUser(token, idToken || undefined);
          }
        }
      }

      return { status: 'CANCELLED' };
    } catch (err: any) {
      return {
        status: 'ERROR',
        errorMessage: err?.message || 'Failed to open official Google Sign-In.',
      };
    }
  },

  /**
   * Request / Send OTP to phone number via the authoritative server OTP engine
   */
  async requestOtpForPhone(
    pending: PendingRegistration,
    phoneRaw: string,
    countryCode: string
  ): Promise<PendingRegistration> {
    const cleanPhone = phoneRaw.replace(/\D/g, '');

    if (!cleanPhone) {
      throw new Error('Please enter your phone number.');
    }

    if (!this.isValidPhone(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit phone number.');
    }

    // Check duplicate phone
    const isDup = await this.isPhoneRegistered(cleanPhone, countryCode);
    if (isDup) {
      throw new Error(
        'This phone number is already linked to a Servex account. Please log in instead.'
      );
    }

    // Server-authoritative OTP challenge creation (enforces cooldown, rate limit, CSPRNG, and HMAC)
    const challengeRes = await OtpService.requestOtp(cleanPhone, countryCode);

    return {
      ...pending,
      phone: cleanPhone,
      countryCode,
      challengeId: challengeRes.challengeId,
      otpExpiresAt: challengeRes.expiresAt,
      otpLastSentAt: Date.now(),
      smsDeliveryProvider: challengeRes.smsDeliveryProvider || 'simulation',
      smsDeliveryMessage:
        challengeRes.smsDeliveryProvider === 'simulation'
          ? 'Simulation mode active (Add FAST2SMS or TWILIO key to .env for real SMS)'
          : `Delivered via ${String(challengeRes.smsDeliveryProvider).toUpperCase()}`,
    };
  },

  /**
   * Verify entered 6-digit OTP via server-authoritative OtpService
   */
  async verifyOtp(pending: PendingRegistration, enteredOtp: string): Promise<boolean> {
    const cleaned = enteredOtp ? enteredOtp.trim() : '';

    if (!cleaned || cleaned.length !== 6) {
      throw new Error('Please enter the complete 6-digit verification code.');
    }

    if (!pending.challengeId) {
      throw new Error('No active verification session found. Please request a verification code.');
    }

    // Server-authoritative verification (checks expiry, attempts, lockout, and HMAC match)
    const result = await OtpService.verifyOtp(pending.challengeId, cleaned, pending.phone);

    if (!result.verified || !result.verificationToken) {
      throw new Error(result.error || 'Incorrect verification code. Please try again.');
    }

    pending.isPhoneVerified = true;
    pending.verificationToken = result.verificationToken;
    return true;
  },

  /**
   * Complete account creation after phone verification & role selection
   */
  async finalizeRegistration(
    pending: PendingRegistration,
    role: UserRole
  ): Promise<{ user: User; session: AppAuthSession }> {
    // Servex Security Requirement: Phone verification is compulsory and must be completed before account creation
    if (!pending.isPhoneVerified || !pending.verificationToken) {
      throw new Error(
        'Registration rejected: Phone verification is compulsory and must be completed before account creation.'
      );
    }

    // Server-authoritative single-use token consumption
    const tokenConsumed = await OtpService.consumeVerificationToken(
      pending.phone,
      pending.verificationToken
    );
    if (!tokenConsumed) {
      throw new Error(
        'Registration rejected: Invalid or expired phone verification token. Please verify your phone number again.'
      );
    }

    // Supabase Auth is the sole password authority and handles salted bcrypt hashing in PostgreSQL.
    // The application does NOT maintain a secondary password database.
    // For local offline test runners without Supabase, hash with standard bcrypt if needed.
    const supabase = getSupabaseClient();
    let supabaseUid: string | null = null;
    const passwordForAuth = pending.passwordRaw;

    let offlineBcryptHash: string | undefined = undefined;
    if (!supabase && passwordForAuth) {
      offlineBcryptHash = bcrypt.hashSync(passwordForAuth, 10);
    }

    if (supabase) {
      try {
        if (pending.authProvider === 'email' && passwordForAuth) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: pending.email.trim().toLowerCase(),
            password: passwordForAuth,
            options: {
              data: {
                name: pending.name.trim(),
                phone: pending.phone.replace(/\D/g, ''),
                role,
              },
            },
          });

          if (!signUpError && signUpData?.user) {
            supabaseUid = signUpData.user.id;
          } else if (signUpError) {
            // If already signed up in Supabase Auth, sign in to link session and get user ID
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: pending.email.trim().toLowerCase(),
              password: passwordForAuth,
            });
            if (signInData?.user) {
              supabaseUid = signInData.user.id;
            }
          }
        } else if (pending.authProvider === 'google' && pending.googleIdToken) {
          const { data: oauthData } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: pending.googleIdToken,
          });
          if (oauthData?.user) {
            supabaseUid = oauthData.user.id;
          }
        }
        if (supabaseUid) {
          try {
            await supabase.rpc('complete_user_onboarding', {
              p_role: role,
              p_phone: pending.phone || '9800000000',
              p_verification_token: pending.verificationToken,
            });
          } catch {
            // Trigger or conflict handled
          }
        }
      } catch {
        // Safe offline fallback
      }
    }

    const newUser: StoredUserAccount = {
      id: supabaseUid || generateUuid(),
      name: pending.name.trim(),
      email: pending.email.trim().toLowerCase(),
      phone: pending.phone.replace(/\D/g, ''),
      countryCode: pending.countryCode || '+91',
      role,
      avatarUrl: pending.avatarUrl,
      authProvider: pending.authProvider,
      createdAt: new Date().toISOString(),
      isPhoneVerified: true,
      passwordHash: offlineBcryptHash,
    };

    await StorageService.addRegisteredUser(newUser);

    const session: AppAuthSession = {
      token: generateSessionToken('srvx_sess_'),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        countryCode: newUser.countryCode,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        authProvider: newUser.authProvider,
        createdAt: newUser.createdAt,
        isPhoneVerified: true,
      },
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await StorageService.saveSession(session);
    return { user: session.user, session };
  },

  /**
   * Request Supabase Auth password recovery email
   * Sends recovery link targeted to deep-link scheme: servex-contractor://reset-password
   */
  async requestPasswordReset(emailRaw: string): Promise<{ success: boolean; message: string }> {
    const email = emailRaw.trim().toLowerCase();

    if (!email) {
      throw new Error('Please enter your email address.');
    }
    if (!this.isValidEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'servex-contractor://reset-password',
        });
        if (error) {
          if (error.message && error.message.toLowerCase().includes('rate limit')) {
            throw new Error('Too many requests. Please wait a few minutes before trying again.');
          }
          // Generic safe error handling to protect account privacy
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Too many requests')) {
          throw err;
        }
        // Fail-safe offline/mock handling
      }
    }

    return {
      success: true,
      message: `If an account is associated with ${email}, a password reset link has been sent.`,
    };
  },

  /**
   * Update password in Supabase Auth during active recovery session
   * Enforces 8+ characters, never logs password, never stores plaintext.
   */
  async updateUserPassword(newPasswordRaw: string): Promise<void> {
    const password = newPasswordRaw;

    if (!password) {
      throw new Error('Please enter a new password.');
    }
    if (password.length < 8) {
      throw new Error('Password must contain at least 8 characters.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw new Error(error.message || 'Failed to update password. Recovery link may have expired.');
      }
    }

    // Terminate recovery session to require fresh credential authentication
    await this.logout();
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Safe offline fallback
      }
    }
    await StorageService.clearSession();
  },
};
