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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { CountryCodePicker, SUPPORTED_COUNTRIES } from '../../components/CountryCodePicker';
import { CountryCodeItem } from '../../types/auth';

export const RegisterScreen: React.FC = () => {
  const {
    startEmailRegistration,
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
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || authError;

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
                  editable={!isSubmitting}
                />
                <Pressable
                  style={styles.eyeToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁'}</Text>
                </Pressable>
              </View>
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
                  placeholderTextColor="#5F636A"
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
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁'}</Text>
                </Pressable>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.inlineWarning}>Passwords do not match.</Text>
              )}
            </View>

            {/* Terms and Conditions Checkbox */}
            <Pressable
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              hitSlop={6}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Pressable>

            {/* Primary Button */}
            <Pressable
              style={({ pressed }) => [
                styles.createBtn,
                pressed && styles.createBtnPressed,
                isSubmitting && styles.btnDisabled,
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="CREATE ACCOUNT"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createBtnText}>CREATE ACCOUNT</Text>
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
    color: '#1A73E8',
    fontSize: 13.5,
    letterSpacing: 1,
  },
});
