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

export const PhoneCollectionScreen: React.FC = () => {
  const {
    pendingRegistration,
    submitPhoneForGoogle,
    cancelRegistration,
    authError,
    clearAuthError,
  } = useAuth();

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(
    SUPPORTED_COUNTRIES[0] // India +91
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || authError;

  const handlePhoneSubmit = async () => {
    setLocalError(null);
    clearAuthError();

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

    setIsSubmitting(true);
    try {
      await submitPhoneForGoogle(cleanPhone, selectedCountry.dialCode);
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
            <Text style={styles.title}>Complete your Servex profile</Text>
            <Text style={styles.subtitle}>
              We need your phone number to secure your account and connect you with clients
              and professionals.
            </Text>
          </View>

          {/* Google Profile Pill */}
          {pendingRegistration?.email && (
            <View style={styles.googlePill}>
              <Text style={styles.googlePillIcon}>✓</Text>
              <View style={styles.googlePillContent}>
                <Text style={styles.googlePillName}>
                  {pendingRegistration.name || 'Google Account'}
                </Text>
                <Text style={styles.googlePillEmail}>{pendingRegistration.email}</Text>
              </View>
            </View>
          )}

          {/* Error Box */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
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
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Action Buttons: Verify Phone Number vs Verify Later */}
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                pressed && styles.sendButtonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={() => handlePhoneSubmit()}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Verify your phone number"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Verify your phone number →</Text>
              )}
            </Pressable>
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
              <Text style={styles.cancelText}>← Back to Login</Text>
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
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13.5,
    lineHeight: 20,
  },
  googlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12151B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 20,
    gap: 12,
  },
  googlePillIcon: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: 'bold',
  },
  googlePillContent: {
    flex: 1,
  },
  googlePillName: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
  },
  googlePillEmail: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12,
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
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    color: '#EDEAE3',
    fontSize: 13,
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
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  phoneInput: {
    paddingLeft: 12,
  },
  sendButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendButtonPressed: {
    backgroundColor: '#1557B0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
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
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 13.5,
  },
});
