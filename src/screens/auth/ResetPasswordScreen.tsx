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
import { EyeIcon } from '../../components/EyeIcon';

export const ResetPasswordScreen: React.FC = () => {
  const {
    updateUserPassword,
    cancelPasswordReset,
    authError,
    clearAuthError,
  } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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

  const handleUpdate = async () => {
    setLocalError(null);
    clearAuthError();

    if (!password) {
      setLocalError('Please enter your new password.');
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

    setIsSubmitting(true);
    try {
      await updateUserPassword(password);
    } catch {
      // Handled in context
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
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your identity has been verified. Choose a secure new password for your Servex account.
            </Text>
          </View>

          {/* Error Banner */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* New Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="New password (8+ characters)"
                  placeholderTextColor="#71717A"
                  selectionColor="#FFFFFF"
                  cursorColor="#FFFFFF"
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
                  autoCorrect={false}
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarRow}>
                    {[1, 2, 3, 4].map((step) => (
                      <View
                        key={step}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              passwordStrength.score >= step
                                ? passwordStrength.color
                                : '#20242D',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm New Password Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm new password"
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
                autoCorrect={false}
                autoComplete="new-password"
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

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="UPDATE PASSWORD"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.primaryButtonText}>UPDATE PASSWORD</Text>
              )}
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              style={styles.cancelButton}
              onPress={cancelPasswordReset}
              hitSlop={8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  cardContainer: {
    backgroundColor: '#14171F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#20242D',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#EF4444',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0C10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#20242D',
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeToggle: {
    padding: 6,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  strengthSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000000',
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#A1A1AA',
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});
