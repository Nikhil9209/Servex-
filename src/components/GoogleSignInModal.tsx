import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { fonts } from '../theme/tokens';
import { GoogleIcon } from './GoogleIcon';

export interface GoogleUserProfile {
  name: string;
  email: string;
  sub: string;
  picture?: string;
}

interface GoogleSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGoogleUser: (user: GoogleUserProfile) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  visible,
  onClose,
  onSelectGoogleUser,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const presetAccounts: GoogleUserProfile[] = [
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      sub: 'google_sub_priya_10982',
    },
    {
      name: 'Nikhil Kumar',
      email: 'nikhil.kumar@gmail.com',
      sub: 'google_sub_nikhil_77192',
    },
  ];

  const handleCustomSubmit = () => {
    setCustomError(null);
    if (!customName.trim()) {
      setCustomError('Please enter your name.');
      return;
    }
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setCustomError('Please enter a valid Google email.');
      return;
    }

    onSelectGoogleUser({
      name: customName.trim(),
      email: customEmail.trim().toLowerCase(),
      sub: `google_sub_${Date.now()}`,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.googleIconContainer}>
              <GoogleIcon size={24} />
            </View>
            <Text style={styles.dialogTitle}>Sign in with Google</Text>
            <Text style={styles.dialogSubtitle}>Choose an account to continue to Servex</Text>
          </View>

          <ScrollView
            style={styles.accountsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Preset Google Accounts */}
            {presetAccounts.map((account) => (
              <Pressable
                key={account.email}
                style={({ pressed }) => [
                  styles.accountRow,
                  pressed && styles.accountRowPressed,
                ]}
                onPress={() => {
                  onSelectGoogleUser(account);
                  onClose();
                }}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {account.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountEmail}>{account.email}</Text>
                </View>
                <Text style={styles.arrowIcon}>➔</Text>
              </Pressable>
            ))}

            {/* Custom Account Toggle */}
            {!showCustomInput ? (
              <Pressable
                style={({ pressed }) => [
                  styles.addAccountRow,
                  pressed && styles.accountRowPressed,
                ]}
                onPress={() => setShowCustomInput(true)}
              >
                <View style={styles.addAvatarCircle}>
                  <Text style={styles.addIcon}>👤</Text>
                </View>
                <View style={styles.accountDetails}>
                  <Text style={styles.addAccountText}>Use another Google account</Text>
                  <Text style={styles.addAccountSub}>Enter your Google credentials</Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.customForm}>
                <Text style={styles.formTitle}>Enter Google Account Details</Text>
                {customError ? (
                  <Text style={styles.errorText}>{customError}</Text>
                ) : null}
                <TextInput
                  style={styles.customInput}
                  placeholder="Your Name (e.g. John Doe)"
                  placeholderTextColor="#656B77"
                  value={customName}
                  onChangeText={setCustomName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.customInput}
                  placeholder="Google Email (e.g. user@gmail.com)"
                  placeholderTextColor="#656B77"
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.formActions}>
                  <Pressable
                    style={styles.cancelActionBtn}
                    onPress={() => setShowCustomInput(false)}
                  >
                    <Text style={styles.cancelActionText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={styles.confirmActionBtn}
                    onPress={handleCustomSubmit}
                  >
                    <Text style={styles.confirmActionText}>Authenticate</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            To continue, Google will share your name, email address, and profile picture with Servex.
          </Text>

          {/* Cancel */}
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121419',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#242833',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dialogTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 13,
  },
  accountsList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232734',
    marginBottom: 10,
  },
  accountRowPressed: {
    backgroundColor: '#1F2432',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14,
  },
  accountEmail: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12,
  },
  arrowIcon: {
    color: '#656B77',
    fontSize: 12,
  },
  addAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141720',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#20242E',
    borderStyle: 'dashed',
  },
  addAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E222D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addIcon: {
    fontSize: 16,
  },
  addAccountText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  addAccountSub: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 11.5,
  },
  customForm: {
    backgroundColor: '#161922',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242833',
    gap: 10,
  },
  formTitle: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 13,
  },
  errorText: {
    fontFamily: fonts.body,
    color: '#EF4444',
    fontSize: 12,
  },
  customInput: {
    backgroundColor: '#111317',
    borderWidth: 1,
    borderColor: '#242833',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelActionText: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12.5,
  },
  confirmActionBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  confirmActionText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  privacyNote: {
    fontFamily: fonts.body,
    color: '#5F636A',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeBtnText: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 13,
  },
});
