import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { fonts } from '../../../theme/tokens';
import { User, UserRole } from '../../../types/auth';
import {
  ShieldCheckIcon,
  ChevronRightIcon,
  SparklesIcon,
  LogoutIcon,
  DashboardTabIcon,
} from '../../../components/ContractorIcons';

interface ProfileSettingsViewProps {
  user: User;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onReplaySplash?: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  user,
  onLogout,
  onSwitchRole,
  onReplaySplash,
}) => {
  const handleLogoutPress = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of Servex Contractor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Text style={styles.pageSub}>Contractor firm credentials and account settings</Text>
        </View>

        {/* CONTRACTOR IDENTITY CARD */}
        <View style={styles.identityCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitial}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>

          <View style={styles.identityInfo}>
            <View style={styles.identityNameRow}>
              <Text style={styles.identityName} numberOfLines={1}>
                {user.name ? `${user.name} Contracting` : 'Prime Contracting Group'}
              </Text>
              <ShieldCheckIcon size={15} color="#10B981" />
            </View>
            <Text style={styles.licenseSubtitle}>Class-1 Prime General Contractor</Text>
            <Text style={styles.contactSubtitle}>{user.email}</Text>
          </View>
        </View>

        {/* COMPANY CREDENTIALS BLOCK */}
        <Text style={styles.sectionHeader}>Firm credentials</Text>

        <View style={styles.credentialsCard}>
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Contractor License</Text>
            <Text style={styles.credVal}>Class-1 Prime (Govt Verified)</Text>
          </View>
          <View style={styles.credDivider} />

          <View style={styles.credRow}>
            <Text style={styles.credLabel}>License Number</Text>
            <Text style={styles.credVal}>SRX-LIC-{user.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.credDivider} />

          <View style={styles.credRow}>
            <Text style={styles.credLabel}>GSTIN Tax ID</Text>
            <Text style={styles.credVal}>27AABCS1429E1Z8</Text>
          </View>
          <View style={styles.credDivider} />

          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Safety Performance</Text>
            <Text style={[styles.credVal, { color: '#10B981' }]}>99.4% Rating</Text>
          </View>
        </View>

        {/* PORTAL & ACTIONS */}
        <Text style={styles.sectionHeader}>Account & settings</Text>

        <View style={styles.actionsMenu}>
          {onSwitchRole && (
            <Pressable
              style={({ pressed }) => [
                styles.actionMenuItem,
                pressed && styles.itemPressed,
              ]}
              onPress={() => onSwitchRole('client')}
            >
              <View style={styles.itemIconBox}>
                <DashboardTabIcon size={16} color="#1A73E8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Switch to Client Portal</Text>
                <Text style={styles.itemSub}>View site projects as a client</Text>
              </View>
              <ChevronRightIcon size={14} color="#71717A" />
            </Pressable>
          )}

          {onReplaySplash && (
            <Pressable
              style={({ pressed }) => [
                styles.actionMenuItem,
                pressed && styles.itemPressed,
              ]}
              onPress={onReplaySplash}
            >
              <View style={styles.itemIconBox}>
                <SparklesIcon size={16} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Servex Monogram Animation</Text>
                <Text style={styles.itemSub}>Replay the 3D brand sequence</Text>
              </View>
              <ChevronRightIcon size={14} color="#71717A" />
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.actionMenuItem,
              styles.logoutItem,
              pressed && styles.itemPressed,
            ]}
            onPress={handleLogoutPress}
          >
            <View style={[styles.itemIconBox, styles.logoutIconBox]}>
              <LogoutIcon size={15} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logoutTitle}>Log Out</Text>
              <Text style={styles.itemSub}>Sign out of your Servex session</Text>
            </View>
            <ChevronRightIcon size={14} color="#EF4444" />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  topHeader: {
    marginBottom: 24,
    paddingTop: 4,
  },
  pageTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 32,
    letterSpacing: -0.6,
  },
  pageSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 26,
    gap: 14,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#23232A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 20,
  },
  identityInfo: {
    flex: 1,
  },
  identityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  identityName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  licenseSubtitle: {
    fontFamily: fonts.bodyMedium,
    color: '#1A73E8',
    fontSize: 12,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 12,
  },
  sectionHeader: {
    fontFamily: fonts.displayBold,
    color: '#8E8E93',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  credentialsCard: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#222228',
    marginBottom: 26,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  credLabel: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 13,
  },
  credVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  credDivider: {
    height: 1,
    backgroundColor: '#222228',
  },
  actionsMenu: {
    backgroundColor: '#16161A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#222228',
    overflow: 'hidden',
    marginBottom: 20,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
    gap: 12,
  },
  itemPressed: {
    backgroundColor: '#1D1D22',
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#23232A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  itemSub: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11.5,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutIconBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  logoutTitle: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 2,
  },
});
