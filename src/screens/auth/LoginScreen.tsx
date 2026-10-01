import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { ServexLivingParticleLogo } from '../../components/ServexLivingParticleLogo';
import { GoogleIcon } from '../../components/GoogleIcon';

// Track whether the particle intro has completed once in this session
let hasViewedParticleIntro = false;

export const LoginScreen: React.FC = () => {
  const {
    loginWithEmail,
    startGoogleSignIn,
    setAuthScreenStep,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Animation values: if user already saw the intro, start at 1; otherwise run 2.0s first-load reveal
  const initialProgress = hasViewedParticleIntro ? 1 : 0;
  const [progressAnim] = useState(() => new Animated.Value(initialProgress));

  useEffect(() => {
    if (!hasViewedParticleIntro) {
      hasViewedParticleIntro = true;
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [progressAnim]);

  const formOpacity = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 0.70, 1.0],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
      }),
    [progressAnim]
  );

  const formTranslateY = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 0.70, 1.0],
        outputRange: [20, 20, 0],
        extrapolate: 'clamp',
      }),
    [progressAnim]
  );

  const handleLogin = async () => {
    if (isSubmitting) return;
    clearAuthError();
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGooglePress = async () => {
    if (isSubmitting) return;
    clearAuthError();
    setIsSubmitting(true);
    try {
      await startGoogleSignIn();
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = (type: 'client' | 'contractor') => {
    if (type === 'client') {
      setEmail('client@servex.com');
      setPassword('Servex@2026');
    } else if (type === 'contractor') {
      setEmail('contractor@servex.com');
      setPassword('Servex@2026');
    }
    clearAuthError();
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
          {/* Living SX White Dot Particle Logo (Continuous Fluid Wave Motion) */}
          <ServexLivingParticleLogo
            introProgress={progressAnim}
            showWordmark={true}
            particleShape="dots"
          />

          {/* Animated Authentication Interface (Smoothly appears underneath logo at 1.7s) */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            }}
          >
            {/* Top Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Servex</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Error Banner */}
            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

          {/* Primary Option: Continue with Google */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleGooglePress}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <View style={styles.googleIconWrapper}>
              <GoogleIcon size={20} />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>

          {/* Divider: OR */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email / Password Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#5F636A"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (authError) clearAuthError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#5F636A"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (authError) clearAuthError();
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!isSubmitting}
                />
                <Pressable
                  style={styles.eyeToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <View style={styles.forgotRow}>
              <Pressable
                onPress={() => {
                  setForgotEmail(email);
                  setForgotSent(false);
                  setShowForgotModal(true);
                }}
                hitSlop={8}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* Primary Action Button: LOGIN */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="LOGIN"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </Pressable>
          </View>

          {/* Bottom Link: Create Account */}
          <View style={styles.bottomSection}>
            <Text style={styles.newText}>New to Servex?</Text>
            <Pressable
              onPress={() => {
                clearAuthError();
                setAuthScreenStep('REGISTER');
              }}
              style={({ pressed }) => [
                styles.createAccountPressable,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <Text style={styles.createAccountText}>CREATE ACCOUNT</Text>
            </Pressable>
          </View>

          {/* Quick Demo Pre-fill helper for reviewer */}
          <View style={styles.demoHelper}>
            <Text style={styles.demoHelperTitle}>Demo Accounts:</Text>
            <View style={styles.demoPillsRow}>
              <Pressable
                style={styles.demoPill}
                onPress={() => fillTestCredentials('client')}
              >
                <Text style={styles.demoPillText}>Client Account</Text>
              </Pressable>
              <Pressable
                style={styles.demoPill}
                onPress={() => fillTestCredentials('contractor')}
              >
                <Text style={styles.demoPillText}>Contractor Account</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalDesc}>
              Enter your email address and we will send a password reset verification link.
            </Text>
            {forgotSent ? (
              <View style={styles.sentBox}>
                <Text style={styles.sentText}>✓ Reset link sent to {forgotEmail}</Text>
              </View>
            ) : (
              <View style={styles.fieldGroup}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter registered email"
                    placeholderTextColor="#5F636A"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => setShowForgotModal(false)}
              >
                <Text style={styles.modalSecondaryText}>Close</Text>
              </Pressable>
              {!forgotSent && (
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    if (forgotEmail) setForgotSent(true);
                  }}
                >
                  <Text style={styles.modalPrimaryText}>Send Link</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
  },
  header: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  logoMargin: {
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 14,
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
    marginBottom: 18,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121419',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242833',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleIconWrapper: {
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonPressed: {
    opacity: 0.8,
    backgroundColor: '#191C24',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#20242D',
  },
  dividerText: {
    fontFamily: fonts.bodyMedium,
    color: '#656B77',
    fontSize: 12,
    paddingHorizontal: 14,
    letterSpacing: 1.5,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#EDEAE3',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111317',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232730',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  passwordInput: {
    paddingRight: 42,
  },
  eyeToggle: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  eyeText: {
    fontSize: 15,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontFamily: fonts.bodyMedium,
    color: '#1A73E8',
    fontSize: 13,
  },
  loginButton: {
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
  loginButtonPressed: {
    backgroundColor: '#1557B0',
  },
  loginButtonText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    letterSpacing: 1.2,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
  },
  newText: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13.5,
  },
  createAccountPressable: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  createAccountText: {
    fontFamily: fonts.displayBold,
    color: '#1A73E8',
    fontSize: 13.5,
    letterSpacing: 1,
  },
  demoHelper: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1D24',
    alignItems: 'center',
  },
  demoHelperTitle: {
    fontFamily: fonts.bodyMedium,
    color: '#5F636A',
    fontSize: 11,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    backgroundColor: '#13161C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  demoPillText: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 11.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F1116',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 6,
  },
  modalDesc: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  sentBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  sentText: {
    fontFamily: fonts.body,
    color: '#10B981',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalSecondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalSecondaryText: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 13,
  },
  modalPrimaryBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalPrimaryText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
