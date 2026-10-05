import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { PhoneCollectionScreen } from '../screens/auth/PhoneCollectionScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';

export const AuthNavigator: React.FC = () => {
  const { authScreenStep } = useAuth();

  switch (authScreenStep) {
    case 'LOGIN':
      return <LoginScreen />;
    case 'REGISTER':
      return <RegisterScreen />;
    case 'FORGOT_PASSWORD':
      return <ForgotPasswordScreen />;
    case 'RESET_PASSWORD':
      return <ResetPasswordScreen />;
    case 'PHONE_COLLECT':
      return <PhoneCollectionScreen />;
    case 'OTP_VERIFY':
      return <OtpVerificationScreen />;
    case 'ROLE_SELECT':
      return <RoleSelectionScreen />;
    default:
      return <LoginScreen />;
  }
};
