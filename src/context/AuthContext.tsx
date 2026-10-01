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
    agreeTerms: boolean
  ) => Promise<void>;
  startGoogleSignIn: () => Promise<boolean>;
  authenticateWithGoogleUser: (profile: {
    name: string;
    email: string;
    sub: string;
    picture?: string;
  }) => Promise<void>;
  submitPhoneForGoogle: (phone: string, countryCode: string) => Promise<void>;
  verifyOtpCode: (enteredOtp: string) => Promise<void>;
  resendOtpCode: () => Promise<void>;
  selectAccountRole: (role: UserRole) => Promise<void>;
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

  // 1. Initial Session Check on App Launch
  useEffect(() => {
    let isMounted = true;
    StorageService.getSession()
      .then((session) => {
        if (!isMounted) return;
        if (session && session.user && session.user.id) {
          setUser(session.user);
        } else {
          setUser(null);
          setAuthScreenStep('LOGIN');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setAuthScreenStep('LOGIN');
      })
      .finally(() => {
        if (!isMounted) return;
        setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, 300);
      });

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
      if (!phone.trim()) {
        const msg = 'Please enter your phone number.';
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
      const isPhoneTaken = await AuthService.isPhoneRegistered(phone, countryCode);
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
        passwordHash: password,
        authProvider: 'email',
        otpCode: '',
        otpExpiresAt: 0,
        otpLastSentAt: 0,
      };

      try {
        const withOtp = await AuthService.requestOtpForPhone(initialPending, phone, countryCode);
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
  const startGoogleSignIn = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await AuthService.signInWithGoogle();

      if (res.status === 'CANCELLED') {
        return false;
      }

      if (res.status === 'ERROR') {
        setAuthError(res.errorMessage || 'Google Sign-In failed.');
        return false;
      }

      // Flow C: Existing Google User
      if (res.status === 'AUTHENTICATED' && res.user) {
        setUser(res.user);
        setPendingRegistration(null);
        return false;
      }

      // Flow B: New Google User -> Mandatory Phone Collection
      if (res.status === 'NEEDS_PHONE' && res.pendingUser) {
        setPendingRegistration(res.pendingUser);
        setAuthScreenStep('PHONE_COLLECT');
        return false;
      }

      // Triggers interactive account chooser modal
      if (res.status === 'PROMPT_ACCOUNT_CHOOSER') {
        return true;
      }

      return false;
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In failed.');
      return false;
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
    async (phone: string, countryCode: string) => {
      setAuthError(null);
      if (!pendingRegistration) {
        setAuthError('Registration session expired. Please sign in again.');
        setAuthScreenStep('LOGIN');
        return;
      }

      try {
        const withOtp = await AuthService.requestOtpForPhone(
          pendingRegistration,
          phone,
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
        // OTP is verified! Proceed to Role Selection
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
    resendOtpCode,
    selectAccountRole,
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
