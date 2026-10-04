import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { CountryCodePicker, SUPPORTED_COUNTRIES } from '../../components/CountryCodePicker';
import { CountryCodeItem } from '../../types/auth';
import { GoogleIcon } from '../../components/GoogleIcon';
import { EyeIcon } from '../../components/EyeIcon';

export const RegisterScreen: React.FC = () => {
  const {
    startEmailRegistration,
    startGoogleSignIn,
    setAuthScreenStep,
    authError,
    clearAuthError,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(
    SUPPORTED_COUNTRIES[0] // India +91
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy'>('terms');

  const displayError = localError || authError;

  const getPasswordStrength = (pass: string): { label: string; score: number; color: string } => {
    if (!pass) return { label: '', score: 0, color: '#20242D' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', score: 1, color: '#EF4444' };
    if (score === 2) return { label: 'Fair', score: 2, color: '#F59E0B' };
    if (score === 3) return { label: 'Good', score: 3, color: '#3B82F6' };
    return { label: 'Strong', score: 4, color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleGooglePress = async () => {
    if (isSubmitting || isGoogleSubmitting) return;
    clearAuthError();
    setLocalError(null);
    setIsGoogleSubmitting(true);
    try {
      await startGoogleSignIn();
    } catch {
      // Handled in context
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setLocalError(null);
    clearAuthError();

    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setLocalError('Please enter your email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setLocalError('Please enter your phone number.');
      return;
    }

    if (
      cleanPhone.length < selectedCountry.minLength ||
      cleanPhone.length > selectedCountry.maxLength
    ) {
      setLocalError(
        `Please enter a valid ${selectedCountry.minLength}-digit phone number for ${selectedCountry.name}.`
      );
      return;
    }

    if (!password) {
      setLocalError('Please create a password.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      setLocalError('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      await startEmailRegistration(
        name,
        email,
        phone,
        selectedCountry.dialCode,
        password,
        agreeTerms
      );
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join Servex to connect with clients and professionals
            </Text>
          </View>

          {/* Primary Social Option: Continue with Google */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.buttonPressed,
              (isSubmitting || isGoogleSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleGooglePress}
            disabled={isSubmitting || isGoogleSubmitting}
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

          {/* Error Banner */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#5F636A"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (displayError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Email */}
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
                    if (displayError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.phoneInputRow}>
                <CountryCodePicker
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                  disabled={isSubmitting}
                />
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder={selectedCountry.placeholder}
                  placeholderTextColor="#5F636A"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (displayError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                  maxLength={15}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Create a password"
                  placeholderTextColor="#5F636A"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (displayError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  selectionColor="#FFFFFF"
                  cursorColor="#FFFFFF"
                  editable={!isSubmitting}
                />
                <Pressable
                  style={styles.eyeToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon visible={showPassword} size={18} color="#A1A1AA" />
                </Pressable>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarsRow}>
                    {[1, 2, 3, 4].map((step) => (
                      <View
                        key={step}
                        style={[
                          styles.strengthBar,
                          step <= passwordStrength.score && {
                            backgroundColor: passwordStrength.color,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    Strength: {passwordStrength.label}
                  </Text>
                </View>
              )}
              {password.length > 0 && password.length < 8 && (
                <Text style={styles.inlineWarning}>
                  Password must contain at least 8 characters.
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#71717A"
                  selectionColor="#FFFFFF"
                  cursorColor="#FFFFFF"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (displayError) {
                      setLocalError(null);
                      clearAuthError();
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
                <Pressable
                  style={styles.eyeToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={8}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon visible={showConfirmPassword} size={18} color="#A1A1AA" />
                </Pressable>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.inlineWarning}>Passwords do not match.</Text>
              )}
            </View>

            {/* Terms and Conditions Checkbox */}
            <View style={styles.termsRow}>
              <Pressable
                style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
                onPress={() => setAgreeTerms(!agreeTerms)}
                hitSlop={6}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreeTerms }}
              >
                {agreeTerms && <Text style={styles.checkboxCheck}>✓</Text>}
              </Pressable>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => {
                    setTermsModalType('terms');
                    setShowTermsModal(true);
                  }}
                >
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => {
                    setTermsModalType('privacy');
                    setShowTermsModal(true);
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Primary Action: Verify phone number */}
            <Pressable
              style={({ pressed }) => [
                styles.createBtn,
                pressed && styles.createBtnPressed,
                isSubmitting && styles.btnDisabled,
              ]}
              onPress={() => handleRegister()}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Verify your phone number"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createBtnText}>Verify your phone number →</Text>
              )}
            </Pressable>
          </View>

          {/* Bottom Back to Login */}
          <View style={styles.bottomSection}>
            <Text style={styles.existingText}>Already have an account?</Text>
            <Pressable
              onPress={() => {
                clearAuthError();
                setAuthScreenStep('LOGIN');
              }}
              style={({ pressed }) => [
                styles.signInPressable,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <Text style={styles.signInText}>SIGN IN</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Terms & Privacy Policy Interactive Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.termsModalContent}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>
                {termsModalType === 'terms'
                  ? 'Servex Terms of Service'
                  : 'Servex Privacy Policy'}
              </Text>
              <Pressable
                onPress={() => setShowTermsModal(false)}
                hitSlop={10}
                style={styles.termsModalClose}
              >
                <Text style={styles.termsModalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={true}>
              {termsModalType === 'terms' ? (
                <View style={styles.termsBody}>
                  <Text style={styles.termsHeading}>1. Professional Marketplace</Text>
                  <Text style={styles.termsParagraph}>
                    Servex is an executive network connecting clients and verified contractors. Both parties agree to honest communication, verified job scopes, and transparent escrow settlements.
                  </Text>
                  <Text style={styles.termsHeading}>2. Mandatory Authentication</Text>
                  <Text style={styles.termsParagraph}>
                    Every participant must maintain a single, verified account backed by phone number two-factor verification. Impersonation or unauthorized account sharing is strictly prohibited.
                  </Text>
                  <Text style={styles.termsHeading}>3. Contractor Obligations</Text>
                  <Text style={styles.termsParagraph}>
                    Contractors warrant that they possess all required trade certifications, maintain safety compliance, and deliver services according to agreed professional specifications.
                  </Text>
                </View>
              ) : (
                <View style={styles.termsBody}>
                  <Text style={styles.termsHeading}>1. Information Protection</Text>
                  <Text style={styles.termsParagraph}>
                    Servex employs AES-256 encrypted storage for authentication sessions, identity tokens, and profile data. We never sell your personal contact information to third parties.
                  </Text>
                  <Text style={styles.termsHeading}>2. Phone Verification Safeguards</Text>
                  <Text style={styles.termsParagraph}>
                    Your phone number is utilized strictly for two-factor authentication, job coordination alerts, and fraud prevention across the marketplace.
                  </Text>
                  <Text style={styles.termsHeading}>3. Google Identity Privacy</Text>
                  <Text style={styles.termsParagraph}>
                    When signing in via Google, Servex requests only standard profile credentials (full name, email address, profile picture). We do not request access to contacts or personal files.
                  </Text>
                </View>
              )}
            </ScrollView>
            <Pressable
              style={styles.termsAcceptBtn}
              onPress={() => {
                setAgreeTerms(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.termsAcceptBtnText}>I UNDERSTAND & AGREE</Text>
            </Pressable>
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
    paddingVertical: 36,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
  },
  header: {
    marginBottom: 22,
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
    fontSize: 13.5,
    lineHeight: 18,
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
  form: {
    gap: 15,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#EDEAE3',
    fontSize: 13,
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
  phoneInputRow: {
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
    paddingVertical: 12,
  },
  phoneInput: {
    paddingLeft: 12,
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
  inlineWarning: {
    fontFamily: fonts.body,
    color: '#F59E0B',
    fontSize: 11.5,
    marginTop: 2,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#303744',
    backgroundColor: '#111317',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12.5,
    lineHeight: 18,
  },
  termsLink: {
    color: '#1A73E8',
    fontFamily: fonts.bodyMedium,
  },
  createBtn: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  createBtnPressed: {
    backgroundColor: '#1557B0',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    letterSpacing: 1.2,
  },
  verifyLaterBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A303C',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  verifyLaterBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: '#3D4450',
  },
  verifyLaterBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#94A3B8',
    fontSize: 13.5,
    letterSpacing: 0.3,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 26,
    gap: 6,
  },
  existingText: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13.5,
  },
  signInPressable: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signInText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13.5,
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1116',
    borderWidth: 1,
    borderColor: '#232730',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  buttonPressed: {
    backgroundColor: '#171A21',
    borderColor: '#303744',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleIconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E222A',
  },
  dividerText: {
    fontFamily: fonts.bodyMedium,
    color: '#5F636A',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  strengthContainer: {
    marginTop: 6,
    gap: 4,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#1A1E26',
  },
  strengthLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  termsModalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#0D0F13',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232730',
    padding: 20,
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1E26',
  },
  termsModalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  termsModalClose: {
    padding: 6,
  },
  termsModalCloseText: {
    color: '#8B8F95',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsScroll: {
    maxHeight: 340,
    marginBottom: 16,
  },
  termsBody: {
    gap: 14,
    paddingRight: 6,
  },
  termsHeading: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  termsParagraph: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12.5,
    lineHeight: 18,
  },
  termsAcceptBtn: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsAcceptBtnText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 1,
  },
});
