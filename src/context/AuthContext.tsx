import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AuthScreenStep,
  PendingRegistration,
  User,
  UserRole,
} from '../types/auth';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storage';
import { getSupabaseSession } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authScreenStep: AuthScreenStep;
  pendingRegistration: PendingRegistration | null;
  authError: string | null;
  infoBanner: string | null;
  lastGeneratedOtp: string | null; // Exposed for verification/testing feedback

  // Navigation within auth stack
  setAuthScreenStep: (step: AuthScreenStep) => void;
  clearAuthError: () => void;
  cancelRegistration: () => void;

  // Actions
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  startEmailRegistration: (
    name: string,
    email: string,
    phone: string,
    countryCode: string,
    password: string,
    agreeTerms: boolean,
    shouldVerifyPhone?: boolean
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
    countryCode: string,
    shouldVerifyPhone?: boolean
  ) => Promise<void>;
  verifyOtpCode: (enteredOtp: string) => Promise<void>;
  skipOtpVerification: () => Promise<void>;
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
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState<string | null>(null);

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

    return () => {
      isMounted = false;
    };
  }, []);

  // Cancel registration and return to Login
  const cancelRegistration = useCallback(() => {
    setPendingRegistration(null);
    setAuthError(null);
    setInfoBanner(null);
    setLastGeneratedOtp(null);
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
      agreeTerms: boolean,
      shouldVerifyPhone: boolean = true
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

      if (!shouldVerifyPhone) {
        // Direct entry: phone saved to profile, skips SMS OTP entirely
        const pendingWithoutOtp: PendingRegistration = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          countryCode: countryCode || '+91',
          passwordRaw: password,
          authProvider: 'email',
          otpCode: '',
          otpExpiresAt: 0,
          otpLastSentAt: 0,
          isPhoneVerified: false,
        };
        setPendingRegistration(pendingWithoutOtp);
        setInfoBanner(null);
        setAuthScreenStep('ROLE_SELECT');
        return;
      }

      const initialPending: PendingRegistration = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: '',
        countryCode: countryCode || '+91',
        passwordRaw: password,
        authProvider: 'email',
        otpCode: '',
        otpExpiresAt: 0,
        otpLastSentAt: 0,
      };

      try {
        const withOtp = await AuthService.requestOtpForPhone(initialPending, cleanPhone, countryCode);
        setPendingRegistration(withOtp);
        setLastGeneratedOtp(withOtp.otpCode);
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

  // Submit Phone for Google User
  const submitPhoneForGoogle = useCallback(
    async (phone: string, countryCode: string, shouldVerifyPhone: boolean = true) => {
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

      if (!shouldVerifyPhone) {
        // Direct entry: phone saved on Google account, skips SMS OTP entirely
        setPendingRegistration({
          ...pendingRegistration,
          phone: cleanPhone,
          countryCode: countryCode || '+91',
          isPhoneVerified: false,
        });
        setInfoBanner(null);
        setAuthScreenStep('ROLE_SELECT');
        return;
      }

      try {
        const withOtp = await AuthService.requestOtpForPhone(
          pendingRegistration,
          cleanPhone,
          countryCode
        );
        setPendingRegistration(withOtp);
        setLastGeneratedOtp(withOtp.otpCode);
        setInfoBanner(`Verification code sent to ${withOtp.countryCode} ${withOtp.phone}`);
        setAuthScreenStep('OTP_VERIFY');
      } catch (err: any) {
        setAuthError(err?.message || 'Failed to send OTP.');
        throw err;
      }
    },
    [pendingRegistration]
  );

  // Verify 6-digit OTP
  const verifyOtpCode = useCallback(
    async (enteredOtp: string) => {
      setAuthError(null);
      if (!pendingRegistration) {
        setAuthError('Verification session expired. Please start again.');
        setAuthScreenStep('LOGIN');
        return;
      }

      try {
        AuthService.verifyOtp(pendingRegistration, enteredOtp);
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

  // Skip Phone Verification for now and proceed directly to Role Selection
  const skipOtpVerification = useCallback(async () => {
    setAuthError(null);
    if (!pendingRegistration) {
      setAuthError('Session expired. Please restart sign-in.');
      setAuthScreenStep('LOGIN');
      return;
    }

    // Set phone as unverified initially, and proceed to role selection
    setPendingRegistration({
      ...pendingRegistration,
      isPhoneVerified: false,
    });
    setInfoBanner(null);
    setAuthScreenStep('ROLE_SELECT');
  }, [pendingRegistration]);

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
      setLastGeneratedOtp(withOtp.otpCode);
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
        setLastGeneratedOtp(null);
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

  // Switch User Role (Client <-> Contractor)
  const switchUserRole = useCallback(
    async (newRole: UserRole) => {
      if (!user) return;
      setIsLoading(true);
      try {
        const updatedUser: User = { ...user, role: newRole };
        const session = await StorageService.getSession();
        if (session) {
          session.user = updatedUser;
          await StorageService.saveSession(session);
        }
        const registeredUsers = await StorageService.getRegisteredUsers();
        const idx = registeredUsers.findIndex(
          (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
        );
        if (idx >= 0) {
          registeredUsers[idx].role = newRole;
          await StorageService.saveRegisteredUsers(registeredUsers);
        }
        setUser(updatedUser);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setPendingRegistration(null);
      setLastGeneratedOtp(null);
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
    lastGeneratedOtp,
    setAuthScreenStep,
    clearAuthError,
    cancelRegistration,
    loginWithEmail,
    startEmailRegistration,
    startGoogleSignIn,
    authenticateWithGoogleUser,
    submitPhoneForGoogle,
    verifyOtpCode,
    skipOtpVerification,
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
