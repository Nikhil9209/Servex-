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
import { User } from '../../../types/auth';
import { AuthService } from '../../../services/authService';

interface ContractorProfileTabProps {
  user: User;
  onLogout: () => void;
  onReplaySplash?: () => void;
}

export const ContractorProfileTab: React.FC<ContractorProfileTabProps> = ({
  user,
  onLogout,
  onReplaySplash,
}) => {
  const formattedPhone = AuthService.formatPhoneForDisplay(user.phone, user.countryCode);

  const handleLogoutPress = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of your Servex account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: onLogout,
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* CONTRACTOR IDENTITY CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>

        <Text style={styles.profileName}>{user.name || 'Contractor Partner'}</Text>
        <Text style={styles.profileContact}>{user.email}</Text>
        <Text style={styles.profilePhone}>Phone: {formattedPhone}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>VERIFIED CONTRACTOR</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>4.9 ★ Top Rated</Text>
          </View>
        </View>
      </View>

      {/* REPUTATION & STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>86</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>99.2%</Text>
          <Text style={styles.statLabel}>On-Time</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>100%</Text>
          <Text style={styles.statLabel}>Safety Score</Text>
        </View>
      </View>

      {/* VERIFICATIONS & CREDENTIALS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trade & Legal Credentials</Text>
      </View>

      <View style={styles.cardGroup}>
        <View style={styles.groupItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>🛡️</Text>
            <View>
              <Text style={styles.itemTitle}>Trade License</Text>
              <Text style={styles.itemSub}>Master Electrical & Structural</Text>
            </View>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>VERIFIED ✓</Text>
          </View>
        </View>

        <View style={styles.groupItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>📄</Text>
            <View>
              <Text style={styles.itemTitle}>GSTIN / Business Tax</Text>
              <Text style={styles.itemSub}>27AAAAA0000A1Z5</Text>
            </View>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>VERIFIED ✓</Text>
          </View>
        </View>

        <View style={styles.groupItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>🏢</Text>
            <View>
              <Text style={styles.itemTitle}>Commercial Liability</Text>
              <Text style={styles.itemSub}>Insured up to ₹50,00,000</Text>
            </View>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>ACTIVE ✓</Text>
          </View>
        </View>
      </View>

      {/* DISPATCH & OPERATING PREFERENCES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dispatch Preferences</Text>
      </View>

      <View style={styles.cardGroup}>
        <Pressable
          style={styles.groupItem}
          onPress={() => Alert.alert('Service Radius', 'Configured service radius: 15 km')}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>📍</Text>
            <View>
              <Text style={styles.itemTitle}>Service Territory Radius</Text>
              <Text style={styles.itemSub}>Mumbai Metro & Suburbs (15 km)</Text>
            </View>
          </View>
          <Text style={styles.chevron}>➔</Text>
        </Pressable>

        <Pressable
          style={styles.groupItem}
          onPress={() => Alert.alert('Emergency Dispatch', 'Emergency dispatch is enabled for off-peak calls.')}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>⚡</Text>
            <View>
              <Text style={styles.itemTitle}>Emergency Night Dispatch</Text>
              <Text style={styles.itemSub}>Enabled • 1.5x Premium Rates</Text>
            </View>
          </View>
          <Text style={styles.chevron}>➔</Text>
        </Pressable>
      </View>

      {/* BRAND & SYSTEM ACTIONS */}
      {onReplaySplash && (
        <View style={styles.actionSection}>
          <Pressable
            style={styles.replayBtn}
            onPress={onReplaySplash}
          >
            <Text style={styles.replayBtnText}>⚡ Replay Servex Monogram Animation</Text>
          </Pressable>
        </View>
      )}

      {/* LOGOUT BUTTON */}
      <View style={styles.logoutSection}>
        <Pressable
          style={styles.logoutBtn}
          onPress={handleLogoutPress}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={styles.logoutBtnText}>Log Out of Servex Account</Text>
        </Pressable>
        <Text style={styles.versionText}>Servex Contractor Suite v1.0.0 • Build 2026</Text>
      </View>
    </ScrollView>
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
    paddingBottom: 36,
  },
  profileCard: {
    backgroundColor: '#111317',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242D',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#1C2028',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D3340',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 28,
  },
  profileName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 3,
  },
  profileContact: {
    fontFamily: fonts.body,
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 2,
  },
  profilePhone: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 12,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#F59E0B',
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111317',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20242D',
  },
  statNum: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  cardGroup: {
    backgroundColor: '#111317',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#20242D',
    overflow: 'hidden',
    marginBottom: 18,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1E26',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  itemIcon: {
    fontSize: 18,
  },
  itemTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 2,
  },
  itemSub: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 11.5,
  },
  verifiedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  verifiedTagText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  chevron: {
    color: '#71717A',
    fontSize: 13,
  },
  actionSection: {
    marginBottom: 14,
  },
  replayBtn: {
    backgroundColor: '#14171E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242935',
  },
  replayBtnText: {
    fontFamily: fonts.displayBold,
    color: '#D4D4D8',
    fontSize: 12.5,
    letterSpacing: 0.3,
  },
  logoutSection: {
    alignItems: 'center',
    marginTop: 6,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoutBtnText: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  versionText: {
    fontFamily: fonts.body,
    color: '#52525B',
    fontSize: 11,
  },
});
