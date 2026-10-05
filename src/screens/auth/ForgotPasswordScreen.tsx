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
import { AuthService } from '../../services/authService';

export const ForgotPasswordScreen: React.FC = () => {
  const {
    requestPasswordReset,
    setAuthScreenStep,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || authError;

  const handleSendLink = async () => {
    setLocalError(null);
    clearAuthError();

    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (!AuthService.isValidEmail(trimmed)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(trimmed);
      setIsSubmitted(true);
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    clearAuthError();
    setAuthScreenStep('LOGIN');
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
            <Text style={styles.title}>
              {isSubmitted ? 'Check your email' : 'Forgot Password'}
            </Text>
            <Text style={styles.subtitle}>
              {isSubmitted
                ? `We sent a recovery link to ${email.trim()}. Tap the link on your device to create a new password.`
                : 'Enter your registered email address and we will send you a link to reset your password.'}
            </Text>
          </View>

          {/* Error Banner */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {!isSubmitted ? (
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Registered email address"
                  placeholderTextColor="#71717A"
                  selectionColor="#FFFFFF"
                  cursorColor="#FFFFFF"
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
                  autoComplete="email"
                  editable={!isSubmitting}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSendLink}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="SEND RESET LINK"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.primaryButtonText}>SEND RESET LINK</Text>
                )}
              </Pressable>

              {/* Return to Login */}
              <Pressable
                style={styles.backButton}
                onPress={handleBackToLogin}
                hitSlop={8}
              >
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.confirmationBox}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.confirmHeading}>Reset Link Dispatched</Text>
              <Text style={styles.confirmSubtext}>
                If an account exists for this address, instructions have been delivered to your inbox.
              </Text>

              <Pressable
                style={styles.resendBtn}
                onPress={() => setIsSubmitted(false)}
              >
                <Text style={styles.resendText}>Use a different email</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={handleBackToLogin}
              >
                <Text style={styles.primaryButtonText}>RETURN TO LOGIN</Text>
              </Pressable>
            </View>
          )}
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
  inputContainer: {
    backgroundColor: '#0A0C10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#20242D',
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  input: {
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 15,
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
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#A1A1AA',
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  confirmationBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: 'bold',
  },
  confirmHeading: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtext: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  resendBtn: {
    marginBottom: 16,
  },
  resendText: {
    color: '#A1A1AA',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
