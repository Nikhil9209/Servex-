import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

export const RoleSelectionScreen: React.FC = () => {
  const { selectAccountRole, authError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await selectAccountRole(selectedRole);
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How will you use Servex?</Text>
            <Text style={styles.subtitle}>Choose your account type</Text>
          </View>

          {/* Error Banner */}
          {authError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          {/* Role Cards Grid */}
          <View style={styles.rolesGrid}>
            {/* Card 1: CLIENT */}
            <Pressable
              style={({ pressed }) => [
                styles.roleCard,
                selectedRole === 'client' && styles.roleCardSelected,
                pressed && styles.roleCardPressed,
              ]}
              onPress={() => setSelectedRole('client')}
              disabled={isSubmitting}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedRole === 'client' }}
            >
              <View style={styles.cardIconBox}>
                <Text style={styles.roleIcon}>👤</Text>
              </View>
              <View style={styles.roleHeaderRow}>
                <Text style={styles.roleTitle}>CLIENT</Text>
                <View
                  style={[
                    styles.radioIndicator,
                    selectedRole === 'client' && styles.radioIndicatorActive,
                  ]}
                >
                  {selectedRole === 'client' && <View style={styles.radioDot} />}
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Find trusted professionals for your home and projects.
              </Text>
            </Pressable>

            {/* Card 2: CONTRACTOR */}
            <Pressable
              style={({ pressed }) => [
                styles.roleCard,
                selectedRole === 'contractor' && styles.roleCardSelected,
                pressed && styles.roleCardPressed,
              ]}
              onPress={() => setSelectedRole('contractor')}
              disabled={isSubmitting}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedRole === 'contractor' }}
            >
              <View style={styles.cardIconBox}>
                <Text style={styles.roleIcon}>🛠️</Text>
              </View>
              <View style={styles.roleHeaderRow}>
                <Text style={styles.roleTitle}>CONTRACTOR</Text>
                <View
                  style={[
                    styles.radioIndicator,
                    selectedRole === 'contractor' && styles.radioIndicatorActive,
                  ]}
                >
                  {selectedRole === 'contractor' && <View style={styles.radioDot} />}
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Find jobs and manage your work with Servex.
              </Text>
            </Pressable>
          </View>

          {/* Primary Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="CONTINUE"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 26,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center',
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
  },
  rolesGrid: {
    gap: 16,
    marginBottom: 28,
  },
  roleCard: {
    backgroundColor: '#111317',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#20242D',
    padding: 20,
  },
  roleCardSelected: {
    borderColor: '#1A73E8',
    backgroundColor: '#131824',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  roleCardPressed: {
    opacity: 0.85,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#191C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  roleIcon: {
    fontSize: 22,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 1,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3A404D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorActive: {
    borderColor: '#1A73E8',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A73E8',
  },
  roleDescription: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13.5,
    lineHeight: 19,
  },
  continueButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  continueButtonPressed: {
    backgroundColor: '#1557B0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
    letterSpacing: 1.2,
  },
});
