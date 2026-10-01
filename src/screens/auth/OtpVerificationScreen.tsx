import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { OtpInput } from '../../components/OtpInput';
import { AuthService } from '../../services/authService';

export const OtpVerificationScreen: React.FC = () => {
  const {
    pendingRegistration,
    verifyOtpCode,
    resendOtpCode,
    setAuthScreenStep,
    cancelRegistration,
    authError,
    clearAuthError,
    lastGeneratedOtp,
    infoBanner,
  } = useAuth();

  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayError = localError || authError;

  // Start 30s countdown timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pendingRegistration?.otpLastSentAt]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    setLocalError(null);
    clearAuthError();

    if (!code || code.length !== 6) {
      setLocalError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyOtpCode(code);
    } catch {
      // Handled in context
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setLocalError(null);
    clearAuthError();
    setIsResending(true);
    try {
      await resendOtpCode();
      setOtp('');
      setCooldown(30);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Handled in context
    } finally {
      setIsResending(false);
    }
  };

  const formattedPhone = pendingRegistration
    ? AuthService.formatPhoneForDisplay(
        pendingRegistration.phone,
        pendingRegistration.countryCode
      )
    : '';

  const handleChangePhone = () => {
    clearAuthError();
    if (pendingRegistration?.authProvider === 'google') {
      setAuthScreenStep('PHONE_COLLECT');
    } else {
      setAuthScreenStep('REGISTER');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.subtitle}>
              We sent a verification code to{'\n'}
              <Text style={styles.phoneHighlight}>{formattedPhone}</Text>
            </Text>

            <Pressable
              onPress={handleChangePhone}
              style={styles.changePhonePressable}
              hitSlop={6}
            >
              <Text style={styles.changePhoneText}>Edit phone number</Text>
            </Pressable>
          </View>

          {/* SMS Status: Live Cellular Dispatch vs Test Simulation */}
          {pendingRegistration?.smsDeliveryProvider &&
          pendingRegistration.smsDeliveryProvider !== 'simulation' ? (
            <View style={styles.liveDeliveryBox}>
              <View style={styles.liveHeaderRow}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveBadgeTitle}>LIVE SMS SENT</Text>
                <Text style={styles.liveProviderName}>
                  via {pendingRegistration.smsDeliveryProvider === 'fast2sms' ? 'Fast2SMS' : 'Twilio'}
                </Text>
              </View>
              <Text style={styles.liveDeliveryDesc}>
                A real SMS with your 6-digit code was sent to your phone SIM card. Check your Messages inbox.
              </Text>
            </View>
          ) : lastGeneratedOtp ? (
            <View style={styles.devCodeBox}>
              <View style={styles.simHeaderRow}>
                <View style={styles.simIndicatorDot} />
                <Text style={styles.devCodeTitle}>TEST / SIMULATION MODE</Text>
                <Text style={styles.simSubtleHint}>(No SMS gateway key in .env)</Text>
              </View>
              <Text style={styles.devCodeValue}>Your verification code: {lastGeneratedOtp}</Text>
              <Text style={styles.simExplainText}>
                To receive live SMS on your mobile phone, add EXPO_PUBLIC_FAST2SMS_API_KEY in .env
              </Text>
              <Pressable
                style={styles.devCodeFillBtn}
                onPress={() => {
                  setOtp(lastGeneratedOtp);
                  handleVerify(lastGeneratedOtp);
                }}
              >
                <Text style={styles.devCodeFillText}>Auto-fill Code</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Info Banner */}
          {infoBanner && !displayError ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{infoBanner}</Text>
            </View>
          ) : null}

          {/* Error Banner */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* 6-digit OTP Input */}
          <OtpInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (displayError) {
                setLocalError(null);
                clearAuthError();
              }
            }}
            onComplete={(fullCode) => handleVerify(fullCode)}
            hasError={Boolean(displayError)}
            disabled={isVerifying}
          />

          {/* Primary Verify Button */}
          <Pressable
            style={({ pressed }) => [
              styles.verifyBtn,
              pressed && styles.verifyBtnPressed,
              (isVerifying || otp.length !== 6) && styles.btnDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={isVerifying || otp.length !== 6}
            accessibilityRole="button"
            accessibilityLabel="VERIFY OTP"
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyBtnText}>VERIFY CODE</Text>
            )}
          </Pressable>

          {/* Resend Cooldown Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendPrompt}>{"Didn't receive the code?"}</Text>
            {cooldown > 0 ? (
              <Text style={styles.cooldownText}>
                Resend OTP in <Text style={styles.cooldownCount}>{cooldown}s</Text>
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={isResending}
                style={({ pressed }) => [
                  styles.resendPressable,
                  pressed && { opacity: 0.6 },
                ]}
                hitSlop={8}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#1A73E8" />
                ) : (
                  <Text style={styles.resendActionText}>Resend OTP</Text>
                )}
              </Pressable>
            )}
          </View>

          {/* Cancel */}
          <View style={styles.bottomSection}>
            <Pressable
              onPress={cancelRegistration}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={8}
            >
              <Text style={styles.cancelText}>Cancel Registration</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  changePhonePressable: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changePhoneText: {
    fontFamily: fonts.bodyMedium,
    color: '#1A73E8',
    fontSize: 12.5,
  },
  liveDeliveryBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  liveBadgeTitle: {
    fontFamily: fonts.displayBold,
    color: '#34D399',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  liveProviderName: {
    fontFamily: fonts.bodyMedium,
    color: '#6EE7B7',
    fontSize: 11,
  },
  liveDeliveryDesc: {
    fontFamily: fonts.body,
    color: '#D1FAE5',
    fontSize: 12,
    lineHeight: 16,
  },
  devCodeBox: {
    backgroundColor: '#121620',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 16,
    alignItems: 'center',
  },
  simHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  simIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  devCodeTitle: {
    fontFamily: fonts.bodyMedium,
    color: '#F59E0B',
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  simSubtleHint: {
    fontFamily: fonts.body,
    color: '#656B77',
    fontSize: 10,
  },
  devCodeValue: {
    fontFamily: fonts.displayBold,
    color: '#60A5FA',
    fontSize: 14,
    marginVertical: 4,
  },
  simExplainText: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  devCodeFillBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  devCodeFillText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 11.5,
  },
  infoBox: {
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  infoText: {
    fontFamily: fonts.body,
    color: '#93C5FD',
    fontSize: 12.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 10,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    fontFamily: fonts.body,
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  verifyBtn: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  verifyBtnPressed: {
    backgroundColor: '#1557B0',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    letterSpacing: 1.2,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 26,
    gap: 6,
  },
  resendPrompt: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13.5,
  },
  cooldownText: {
    fontFamily: fonts.body,
    color: '#5F636A',
    fontSize: 13,
  },
  cooldownCount: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
  },
  resendPressable: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  resendActionText: {
    fontFamily: fonts.displayBold,
    color: '#1A73E8',
    fontSize: 13.5,
    letterSpacing: 0.5,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontFamily: fonts.body,
    color: '#656B77',
    fontSize: 13,
  },
});
