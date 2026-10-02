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
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of the Servex Contractor Suite?', [
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
      {/* PRIME CONTRACTOR COMPANY CARD */}
      <View style={styles.companyCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>

        <Text style={styles.companyName}>
          {user.name ? `${user.name} Contracting & Infra` : 'Servex Prime Contracting'}
        </Text>
        <Text style={styles.authorizedDirector}>
          Authorized Principal: {user.name}
        </Text>
        <Text style={styles.companyContact}>{user.email} • {formattedPhone}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>CLASS-1 PRIME CONTRACTOR</Text>
          </View>
          <View style={styles.isoBadge}>
            <Text style={styles.isoBadgeText}>ISO 9001:2015 ✓</Text>
          </View>
        </View>
      </View>

      {/* WORKFORCE & FLEET OVERVIEW */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Workforce & Site Deployment</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>34</Text>
          <Text style={styles.statLabel}>Crew on Payroll</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>3</Text>
          <Text style={styles.statLabel}>Site Foremen</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>100%</Text>
          <Text style={styles.statLabel}>Safety Score</Text>
        </View>
      </View>

      {/* CORPORATE LEGAL & TRADE CREDENTIALS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Licenses & Compliance</Text>
      </View>

      <View style={styles.cardGroup}>
        <View style={styles.groupItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>🛡️</Text>
            <View>
              <Text style={styles.itemTitle}>State Electrical Board Class-1</Text>
              <Text style={styles.itemSub}>High Tension (HT) & EHV Certified</Text>
            </View>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>ACTIVE ✓</Text>
          </View>
        </View>

        <View style={styles.groupItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>📄</Text>
            <View>
              <Text style={styles.itemTitle}>Corporate GSTIN</Text>
              <Text style={styles.itemSub}>27AAAAA0000A1Z5 (Valid)</Text>
            </View>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>VERIFIED ✓</Text>
          </View>
        </View>

        <View style={styles.groupItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>👷‍♂️</Text>
            <View>
              <Text style={styles.itemTitle}>Workmen Compensation Insurance</Text>
              <Text style={styles.itemSub}>All 34 Workers Insured (₹1,00,00,000)</Text>
            </View>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>INSURED ✓</Text>
          </View>
        </View>
      </View>

      {/* CONTRACTOR FLEET & HEAVY EQUIPMENT */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Contractor Heavy Machinery & Fleet</Text>
      </View>

      <View style={styles.cardGroup}>
        <Pressable
          style={styles.groupItem}
          onPress={() => Alert.alert('Contractor Machinery', 'Fleet: 4 Mobile Diesel DG Gensets, 2 Scissor Lifts, 1 Armored Cable Puller, 3 Megger HV Calibration Kits.')}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>🚜</Text>
            <View>
              <Text style={styles.itemTitle}>4 Heavy Gensets & 2 Lifts</Text>
              <Text style={styles.itemSub}>Allocated across BKC & Lodha Job Sites</Text>
            </View>
          </View>
          <Text style={styles.chevron}>➔</Text>
        </Pressable>

        <Pressable
          style={styles.groupItem}
          onPress={() => Alert.alert('Subcontractor Network', '8 Authorized specialist sub-contractors on call.')}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>🤝</Text>
            <View>
              <Text style={styles.itemTitle}>Specialist Subcontractors</Text>
              <Text style={styles.itemSub}>HVAC Ducting & Fire Alarm Partners</Text>
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

      {/* LOGOUT */}
      <View style={styles.logoutSection}>
        <Pressable
          style={styles.logoutBtn}
          onPress={handleLogoutPress}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={styles.logoutBtnText}>Log Out of Contractor Suite</Text>
        </Pressable>
        <Text style={styles.versionText}>Servex Prime Contractor Suite v2.0 • Enterprise Edition</Text>
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
  companyCard: {
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
  companyName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
    marginBottom: 3,
    textAlign: 'center',
  },
  authorizedDirector: {
    fontFamily: fonts.bodyMedium,
    color: '#D4D4D8',
    fontSize: 13,
    marginBottom: 2,
  },
  companyContact: {
    fontFamily: fonts.body,
    color: '#71717A',
    fontSize: 12,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  classBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  isoBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  isoBadgeText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
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
