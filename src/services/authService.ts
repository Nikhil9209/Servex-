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

WebBrowser.maybeCompleteAuthSession();

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
    const foundUser = users.find((u) => u.email.toLowerCase() === email);

    if (!foundUser) {
      throw new Error('An account with this email was not found. Please create an account.');
    }

    if (foundUser.passwordHash && foundUser.passwordHash !== password) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }

    // Prepare session
    const session: AppAuthSession = {
      token: `srvx_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
  async processGoogleIdentity(googleUser: {
    name: string;
    email: string;
    sub: string;
    picture?: string;
  }): Promise<GoogleAuthResult> {
    // 1. Check if user already exists in Servex database
    const existingUsers = await StorageService.getRegisteredUsers();
    const existingAccount = existingUsers.find(
      (u) =>
        u.email.toLowerCase() === googleUser.email.toLowerCase() ||
        (u.authProvider === 'google' && u.email.toLowerCase() === googleUser.email.toLowerCase())
    );

    // Flow C: Existing Google user with verified phone & assigned role
    if (existingAccount && existingAccount.isPhoneVerified && existingAccount.role) {
      const session: AppAuthSession = {
        token: `srvx_sess_g_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
          isPhoneVerified: true,
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
      avatarUrl: googleUser.picture,
      otpCode: '',
      otpExpiresAt: 0,
      otpLastSentAt: 0,
    };

    return { status: 'NEEDS_PHONE', pendingUser: pending };
  },

  /**
   * Official Google OAuth Sign-In flow
   * Launches Google's official accounts login via browser / In-App Browser tab
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

    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'servex-contractor',
      });

      const request = new AuthSession.AuthRequest({
        clientId: customClientId.trim(),
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
        const userInfoResponse = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint, {
          headers: { Authorization: `Bearer ${result.params.access_token}` },
        });

        if (userInfoResponse.ok) {
          const profile = await userInfoResponse.json();
          return this.processGoogleIdentity({
            name: profile.name || 'Google User',
            email: profile.email,
            sub: profile.sub,
            picture: profile.picture,
          });
        } else {
          return {
            status: 'ERROR',
            errorMessage: 'Failed to retrieve profile from Google. Please try again.',
          };
        }
      }

      if (result.type === 'error') {
        return {
          status: 'ERROR',
          errorMessage: result.error?.message || 'Google authentication error occurred.',
        };
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
   * Generates a 6-digit OTP code and records cooldown & expiration
   */
  generateOtp(): { code: string; expiresAt: number } {
    // 6-digit cryptographic-style numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    return { code, expiresAt };
  },

  /**
   * Request / Send OTP to phone number
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

    // Enforce cooldown if resending
    if (pending.otpLastSentAt && Date.now() - pending.otpLastSentAt < 30000) {
      const waitSec = Math.ceil((30000 - (Date.now() - pending.otpLastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting another code.`);
    }

    const { code, expiresAt } = this.generateOtp();

    return {
      ...pending,
      phone: cleanPhone,
      countryCode,
      otpCode: code,
      otpExpiresAt: expiresAt,
      otpLastSentAt: Date.now(),
    };
  },

  /**
   * Verify entered 6-digit OTP
   */
  verifyOtp(pending: PendingRegistration, enteredOtp: string): boolean {
    const cleaned = enteredOtp.trim();

    if (!cleaned || cleaned.length !== 6) {
      throw new Error('Please enter the complete 6-digit verification code.');
    }

    if (Date.now() > pending.otpExpiresAt) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    if (cleaned !== pending.otpCode) {
      throw new Error('Incorrect verification code. Please try again.');
    }

    return true;
  },

  /**
   * Complete account creation after phone verification & role selection
   */
  async finalizeRegistration(
    pending: PendingRegistration,
    role: UserRole
  ): Promise<{ user: User; session: AppAuthSession }> {
    const newUser: StoredUserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: pending.name.trim(),
      email: pending.email.trim().toLowerCase(),
      phone: pending.phone.replace(/\D/g, ''),
      countryCode: pending.countryCode || '+91',
      role,
      avatarUrl: pending.avatarUrl,
      authProvider: pending.authProvider,
      createdAt: new Date().toISOString(),
      isPhoneVerified: true,
      passwordHash: pending.passwordHash,
    };

    await StorageService.addRegisteredUser(newUser);

    const session: AppAuthSession = {
      token: `srvx_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
   * Logout user
   */
  async logout(): Promise<void> {
    await StorageService.clearSession();
  },
};
