import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Linking } from 'react-native';
import {
  AuthScreenStep,
  PendingRegistration,
  User,
  UserRole,
} from '../types/auth';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storage';
import { getSupabaseClient, getSupabaseSession } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authScreenStep: AuthScreenStep;
  pendingRegistration: PendingRegistration | null;
  authError: string | null;
  infoBanner: string | null;

  // Navigation within auth stack
  setAuthScreenStep: (step: AuthScreenStep) => void;
  clearAuthError: () => void;
  cancelRegistration: () => void;

  // Password Recovery
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  cancelPasswordReset: () => void;

  // Actions
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  startEmailRegistration: (
    name: string,
    email: string,
    phone: string,
    countryCode: string,
    password: string,
    agreeTerms: boolean
  ) => Promise<void>;
  startGoogleSignIn: () => Promise<void>;
  authenticateWithGoogleUser: (profile: {
    name: string;
    email: string;
    sub: string;
    picture?: string;
  }) => Promise<void>;
  submitPhoneForGoogle: (
    phone: string,
    countryCode: string
  ) => Promise<void>;
  verifyOtpCode: (enteredOtp: string) => Promise<void>;
  resendOtpCode: () => Promise<void>;
  selectAccountRole: (role: UserRole) => Promise<void>;
  switchUserRole: (newRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authScreenStep, setAuthScreenStep] = useState<AuthScreenStep>('LOGIN');
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // 1. Initial Session Check on App Launch (Local + Supabase Auth synchronization)
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const [localSession, supabaseSession] = await Promise.all([
          StorageService.getSession(),
          getSupabaseSession().catch(() => null),
        ]);

        if (!isMounted) return;

        if (localSession && localSession.user && localSession.user.id) {
          // Align user.id with authenticated Supabase auth.uid() when available
          if (supabaseSession?.user?.id) {
            localSession.user.id = supabaseSession.user.id;
          }
          setUser(localSession.user);
        } else if (supabaseSession?.user?.id) {
          // Session found in Supabase Auth
          const registeredUsers = await StorageService.getRegisteredUsers();
          const matched = registeredUsers.find(
            (u) =>
              u.id === supabaseSession.user.id ||
              u.email.toLowerCase() === (supabaseSession.user.email || '').toLowerCase()
          );
          if (matched) {
            matched.id = supabaseSession.user.id;
            setUser(matched);
          } else {
            setUser(null);
            setAuthScreenStep('LOGIN');
          }
        } else {
          setUser(null);
          setAuthScreenStep('LOGIN');
        }
      } catch {
        if (!isMounted) return;
        setUser(null);
        setAuthScreenStep('LOGIN');
      } finally {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          }, 300);
        }
      }
    }

    restoreSession();

    // 2. Listen for Supabase Auth state changes (especially PASSWORD_RECOVERY event)
    const supabase = getSupabaseClient();
    let authSub: { unsubscribe: () => void } | null = null;
    if (supabase) {
      try {
        const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setAuthScreenStep('RESET_PASSWORD');
          }
        });
        authSub = listener.subscription;
      } catch {
        // Safe mock / test fallback
      }
    }

    // 3. Listen for incoming deep links (e.g. servex-contractor://reset-password...)
    const processIncomingDeepLink = async (url: string | null) => {
      if (!url) return;
      if (url.includes('reset-password')) {
        const client = getSupabaseClient();
        if (!client) return;

        // Check for error in URL query
        const queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
          const queryParams = new URLSearchParams(url.substring(queryIndex + 1));
          const errorDesc = queryParams.get('error_description');
          const code = queryParams.get('code');
          if (errorDesc) {
            setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
            setAuthScreenStep('FORGOT_PASSWORD');
            return;
          }
          if (code) {
            try {
              const { error } = await client.auth.exchangeCodeForSession(code);
              if (error) {
                setAuthError('This password reset link has expired or is invalid. Please request a new one.');
                setAuthScreenStep('FORGOT_PASSWORD');
                return;
              }
              setAuthScreenStep('RESET_PASSWORD');
              return;
            } catch {
              setAuthError('Unable to process recovery link. Please try again.');
              setAuthScreenStep('FORGOT_PASSWORD');
              return;
            }
          }
        }

        // Check for tokens in hash fragment (#access_token=...&refresh_token=...&type=recovery)
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
          const errorDesc = hashParams.get('error_description');
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (errorDesc) {
            setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
            setAuthScreenStep('FORGOT_PASSWORD');
            return;
          }
          if (accessToken && refreshToken) {
            try {
              const { error } = await client.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                setAuthError('This password reset link has expired or is invalid. Please request a new one.');
                setAuthScreenStep('FORGOT_PASSWORD');
                return;
              }
              setAuthScreenStep('RESET_PASSWORD');
              return;
            } catch {
              setAuthError('Unable to process recovery link. Please try again.');
              setAuthScreenStep('FORGOT_PASSWORD');
              return;
            }
          }
        }
      }
    };

    // Cold-start deep link check
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && isMounted) {
        processIncomingDeepLink(initialUrl);
      }
    });

    // Warm deep link listener
    const linkingSub = Linking.addEventListener('url', (evt) => {
      if (isMounted) {
        processIncomingDeepLink(evt.url);
      }
    });

    return () => {
      isMounted = false;
      if (authSub) authSub.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  // Cancel registration and return to Login
  const cancelRegistration = useCallback(() => {
    setPendingRegistration(null);
    setAuthError(null);
    setInfoBanner(null);
    setAuthScreenStep('LOGIN');
  }, []);

  // Request Password Reset
  const requestPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const result = await AuthService.requestPasswordReset(email);
      setInfoBanner(result.message);
      return result;
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send password reset email.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update Password in Recovery Mode
  const updateUserPassword = useCallback(async (newPassword: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await AuthService.updateUserPassword(newPassword);
      setAuthScreenStep('LOGIN');
      setInfoBanner('Password updated successfully! Please sign in with your new password.');
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to update password.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancel Password Reset
  const cancelPasswordReset = useCallback(() => {
    setAuthError(null);
    setInfoBanner(null);
    AuthService.logout().catch(() => {});
    setAuthScreenStep('LOGIN');
  }, []);

  // Email/Password Login
  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { user: authedUser } = await AuthService.loginWithEmail(email, pass);
      setUser(authedUser);
      setPendingRegistration(null);
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Normal Email Registration
  const startEmailRegistration = useCallback(
    async (
      name: string,
      email: string,
      phone: string,
      countryCode: string,
      password: string,
      agreeTerms: boolean
    ) => {
      setAuthError(null);

      if (!name.trim()) {
        const msg = 'Please enter your full name.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (!email.trim()) {
        const msg = 'Please enter your email.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (!AuthService.isValidEmail(email)) {
        const msg = 'Please enter a valid email address.';
        setAuthError(msg);
        throw new Error(msg);
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone) {
        const msg = 'Please enter your phone number.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (!AuthService.isValidPhone(cleanPhone)) {
        const msg = 'Please enter a valid 10-digit phone number.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (!password) {
        const msg = 'Please enter a password.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (password.length < 8) {
        const msg = 'Password must contain at least 8 characters.';
        setAuthError(msg);
        throw new Error(msg);
      }
      if (!agreeTerms) {
        const msg = 'You must agree to the Terms & Conditions and Privacy Policy.';
        setAuthError(msg);
        throw new Error(msg);
      }

      // Check duplicate email
      const isEmailTaken = await AuthService.isEmailRegistered(email);
      if (isEmailTaken) {
        const msg = 'An account with this email already exists.\nPlease log in instead.';
        setAuthError(msg);
        throw new Error(msg);
      }

      // Check duplicate phone
      const isPhoneTaken = await AuthService.isPhoneRegistered(cleanPhone, countryCode);
      if (isPhoneTaken) {
        const msg = 'This phone number is already linked to a Servex account.\nPlease log in instead.';
        setAuthError(msg);
        throw new Error(msg);
      }

      const initialPending: PendingRegistration = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: '',
        countryCode: countryCode || '+91',
        passwordRaw: password,
        authProvider: 'email',
        otpExpiresAt: 0,
        otpLastSentAt: 0,
      };

      try {
        const withOtp = await AuthService.requestOtpForPhone(initialPending, cleanPhone, countryCode);
        setPendingRegistration(withOtp);
        setInfoBanner(`Verification code sent to ${withOtp.countryCode} ${withOtp.phone}`);
        setAuthScreenStep('OTP_VERIFY');
      } catch (err: any) {
        setAuthError(err?.message || 'Failed to send OTP.');
        throw err;
      }
    },
    []
  );

  // Google Sign-In
  const startGoogleSignIn = useCallback(async (): Promise<void> => {
    setAuthError(null);
    try {
      const res = await AuthService.signInWithGoogle();

      if (res.status === 'CANCELLED') {
        return;
      }

      if (res.status === 'ERROR') {
        setAuthError(res.errorMessage || 'Google Sign-In failed.');
        return;
      }

      // Flow C: Existing Google User
      if (res.status === 'AUTHENTICATED' && res.user) {
        setUser(res.user);
        setPendingRegistration(null);
        return;
      }

      // Flow B: New Google User -> Mandatory Phone Collection
      if (res.status === 'NEEDS_PHONE' && res.pendingUser) {
        setPendingRegistration(res.pendingUser);
        setAuthScreenStep('PHONE_COLLECT');
        return;
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In failed.');
    }
  }, []);

  // Authenticate with verified Google Profile (Flow C or Flow B)
  const authenticateWithGoogleUser = useCallback(
    async (profile: { name: string; email: string; sub: string; picture?: string }) => {
      setAuthError(null);
      setIsLoading(true);
      try {
        const res = await AuthService.processGoogleIdentity(profile);

        // Flow C: Existing Google User
        if (res.status === 'AUTHENTICATED' && res.user) {
          setUser(res.user);
          setPendingRegistration(null);
          return;
        }

        // Flow B: New Google User -> Mandatory Phone Collection
        if (res.status === 'NEEDS_PHONE' && res.pendingUser) {
          setPendingRegistration(res.pendingUser);
          setAuthScreenStep('PHONE_COLLECT');
        }
      } catch (err: any) {
        setAuthError(err?.message || 'Google authentication failed.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Submit Phone for Google User (Compulsory OTP verification)
  const submitPhoneForGoogle = useCallback(
    async (phone: string, countryCode: string) => {
      setAuthError(null);
      if (!pendingRegistration) {
        setAuthError('Registration session expired. Please sign in again.');
        setAuthScreenStep('LOGIN');
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone) {
        throw new Error('Please enter your phone number.');
      }
      if (!AuthService.isValidPhone(cleanPhone)) {
        throw new Error('Please enter a valid 10-digit phone number.');
      }
      const isDup = await AuthService.isPhoneRegistered(cleanPhone, countryCode);
      if (isDup) {
        throw new Error(
          'This phone number is already linked to a Servex account. Please log in instead.'
        );
      }

      try {
        const withOtp = await AuthService.requestOtpForPhone(
          pendingRegistration,
          cleanPhone,
          countryCode
        );
        setPendingRegistration(withOtp);
        setInfoBanner(`Verification code sent to ${withOtp.countryCode} ${withOtp.phone}`);
        setAuthScreenStep('OTP_VERIFY');
      } catch (err: any) {
        setAuthError(err?.message || 'Failed to send OTP.');
        throw err;
      }
    },
    [pendingRegistration]
  );

  // Verify 6-digit OTP via server-authoritative AuthService
  const verifyOtpCode = useCallback(
    async (enteredOtp: string) => {
      setAuthError(null);
      if (!pendingRegistration) {
        setAuthError('Verification session expired. Please start again.');
        setAuthScreenStep('LOGIN');
        return;
      }

      try {
        await AuthService.verifyOtp(pendingRegistration, enteredOtp);
        // OTP is verified! Mark verified & proceed to Role Selection
        setPendingRegistration({
          ...pendingRegistration,
          isPhoneVerified: true,
        });
        setInfoBanner(null);
        setAuthScreenStep('ROLE_SELECT');
      } catch (err: any) {
        setAuthError(err?.message || 'Incorrect verification code. Please try again.');
        throw err;
      }
    },
    [pendingRegistration]
  );

  // Resend OTP
  const resendOtpCode = useCallback(async () => {
    setAuthError(null);
    if (!pendingRegistration || !pendingRegistration.phone) {
      setAuthError('Phone number missing. Please restart registration.');
      return;
    }

    try {
      const withOtp = await AuthService.requestOtpForPhone(
        pendingRegistration,
        pendingRegistration.phone,
        pendingRegistration.countryCode
      );
      setPendingRegistration(withOtp);
      setInfoBanner(`New code sent to ${withOtp.countryCode} ${withOtp.phone}`);
    } catch (err: any) {
      setAuthError(err?.message || 'Could not resend OTP.');
      throw err;
    }
  }, [pendingRegistration]);

  // Select Role (Client or Contractor) and Complete Servex Registration
  const selectAccountRole = useCallback(
    async (role: UserRole) => {
      setAuthError(null);
      if (!pendingRegistration) {
        setAuthError('Session expired. Please start registration again.');
        setAuthScreenStep('LOGIN');
        return;
      }

      setIsLoading(true);
      try {
        const { user: registeredUser } = await AuthService.finalizeRegistration(
          pendingRegistration,
          role
        );
        setUser(registeredUser);
        setPendingRegistration(null);
        setInfoBanner(null);
      } catch (err: any) {
        setAuthError(err?.message || 'Account creation failed.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [pendingRegistration]
  );

  // Switch User Role (Protected by Server-Authoritative Role Enforcement)
  const switchUserRole = useCallback(
    async (_newRole: UserRole) => {
      // Stage 5 — Remediation 3: Database role enforcement
      // Clients cannot modify their own authorization level through exposed client APIs
      throw new Error(
        'Unauthorized: Client cannot modify its own role. User role changes are server-authoritative and immutable through client APIs.'
      );
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setPendingRegistration(null);
      setAuthError(null);
      setInfoBanner(null);
      setAuthScreenStep('LOGIN');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user && user.id),
    isLoading,
    authScreenStep,
    pendingRegistration,
    authError,
    infoBanner,
    setAuthScreenStep,
    clearAuthError,
    cancelRegistration,
    requestPasswordReset,
    updateUserPassword,
    cancelPasswordReset,
    loginWithEmail,
    startEmailRegistration,
    startGoogleSignIn,
    authenticateWithGoogleUser,
    submitPhoneForGoogle,
    verifyOtpCode,
    resendOtpCode,
    selectAccountRole,
    switchUserRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
