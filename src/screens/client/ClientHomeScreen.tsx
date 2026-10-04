import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../../theme/tokens';
import { User } from '../../types/auth';
import { ServexLogo } from '../../components/ServexLogo';
import { AuthService } from '../../services/authService';
import { useContractor } from '../../context/ContractorContext';
import { PdfBillModal } from '../contractor/pages/PdfBillModal';
import { ContractorProjectDetail } from '../../types/contractor';
import { FileTextIcon } from '../../components/ContractorIcons';

interface ClientHomeScreenProps {
  user: User;
  onLogout: () => void;
}

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({ user, onLogout }) => {
  const { projects } = useContractor();
  const [searchQuery, setSearchQuery] = useState('');
  const [billModalProject, setBillModalProject] = useState<ContractorProjectDetail | null>(null);

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

  const services = [
    { id: '1', title: 'Electrical & Wiring', icon: '⚡', pros: '28 available', tag: 'Fast' },
    { id: '2', title: 'Plumbing & Drainage', icon: '🔧', pros: '19 available', tag: 'Popular' },
    { id: '3', title: 'HVAC & Climate', icon: '❄️', pros: '14 available', tag: 'Certified' },
    { id: '4', title: 'Carpentry & Framing', icon: '🪚', pros: '22 available', tag: 'Top Rated' },
    { id: '5', title: 'Masonry & Roofing', icon: '🧱', pros: '11 available', tag: 'Commercial' },
    { id: '6', title: 'Painting & Finishing', icon: '🎨', pros: '16 available', tag: 'Insured' },
  ];

  const formattedPhone = AuthService.formatPhoneForDisplay(user.phone, user.countryCode);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.clientBrandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>SERVEX CLIENT • CONNECTED</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleLogoutPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Text style={styles.logoutText}>Logout ➔</Text>
            </Pressable>
          </View>
        </View>

        {/* User Welcome Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.roleBadgeRow}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>CLIENT</Text>
              </View>
            </View>
            <Text style={styles.userContact}>{user.email}</Text>
            <Text style={styles.userPhone}>
              {user.isPhoneVerified ? 'Verified: ' : 'Phone (Unverified): '}
              {formattedPhone}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search verified contractors & services..."
            placeholderTextColor="#5F636A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* My Contracted Construction Sites (Connected from Backend Store) */}
        {projects.length > 0 && (
          <View style={styles.clientSitesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Construction Sites</Text>
              <Text style={styles.sectionSubtitle}>{projects.length} sites</Text>
            </View>

            {projects.slice(0, 2).map((p) => {
              const totalScope = p.scopeItems.reduce((acc, s) => acc + s.totalAmount, 0);
              const doneValue = p.scopeItems.reduce((acc, s) => acc + s.completedQuantity * s.ratePerUnit, 0);
              const pct = totalScope > 0 ? Math.round((doneValue / totalScope) * 100) : 0;
              const workersToday = p.todayAttendance.filter((a) => a.status === 'present').length;

              return (
                <View key={p.id} style={styles.siteProjectCard}>
                  <View style={styles.siteCardHeader}>
                    <View style={styles.clientCodeBadge}>
                      <Text style={styles.clientCodeText}>{p.clientCode}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.statusText}>{p.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.siteProjectTitle}>{p.projectName}</Text>
                  <Text style={styles.siteAddressText} numberOfLines={1}>📍 {p.siteAddress}</Text>

                  {/* Progress & Stats */}
                  <View style={styles.siteStatsRow}>
                    <View style={styles.siteStatCol}>
                      <Text style={styles.siteStatLabel}>Execution</Text>
                      <Text style={styles.siteStatVal}>{pct}%</Text>
                    </View>
                    <View style={styles.siteStatDivider} />
                    <View style={styles.siteStatCol}>
                      <Text style={styles.siteStatLabel}>Work Done</Text>
                      <Text style={[styles.siteStatVal, { color: '#38BDF8' }]}>₹{doneValue.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.siteStatDivider} />
                    <View style={styles.siteStatCol}>
                      <Text style={styles.siteStatLabel}>Crew On-Site</Text>
                      <Text style={styles.siteStatVal}>{workersToday} workers</Text>
                    </View>
                  </View>

                  {/* Progress track */}
                  <View style={styles.siteTrack}>
                    <View style={[styles.siteTrackFill, { width: `${pct}%` }]} />
                  </View>

                  {/* Client Actions */}
                  <View style={styles.siteActionsRow}>
                    <Pressable
                      style={styles.viewBillBtn}
                      onPress={() => setBillModalProject(p)}
                    >
                      <FileTextIcon size={14} color="#000000" />
                      <Text style={styles.viewBillBtnText}>View Running Account RA Bill</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Active Booking Banner */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          <Text style={styles.sectionSubtitle}>1 in progress</Text>
        </View>

        <View style={styles.bookingCard}>
          <View style={styles.bookingStatusRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SCHEDULED</Text>
            </View>
            <Text style={styles.bookingTime}>Tomorrow, 10:00 AM</Text>
          </View>
          <Text style={styles.bookingTitle}>Full Diagnostic & Circuit Verification</Text>
          <Text style={styles.bookingContractor}>Assigned: Marcus Vance (Master Electrician)</Text>
          <View style={styles.bookingFooter}>
            <Text style={styles.bookingLocation}>📍 Mumbai Metro Zone</Text>
            <Text style={styles.bookingCost}>₹2,400 est.</Text>
          </View>
        </View>

        {/* Services Marketplace Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Find Trusted Professionals</Text>
          <Text style={styles.sectionSubtitle}>Select category to request quote</Text>
        </View>

        <View style={styles.servicesGrid}>
          {services.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.serviceCard,
                pressed && styles.serviceCardPressed,
              ]}
              onPress={() => {
                Alert.alert(item.title, `Browsing verified contractors for ${item.title}.`);
              }}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceIcon}>{item.icon}</Text>
                <View style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{item.tag}</Text>
                </View>
              </View>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.servicePros}>{item.pros}</Text>
            </Pressable>
          ))}
        </View>

        {/* Security & Account Footer */}
        <View style={styles.footerNote}>
          <ServexLogo size={28} showBadge={false} />
          <Text style={styles.footerText}>
            Secured Servex Account • Phone Verified via OTP
          </Text>
        </View>
      </ScrollView>

      {billModalProject && (
        <PdfBillModal
          visible={true}
          project={billModalProject}
          onClose={() => setBillModalProject(null)}
        />
      )}
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
    paddingTop: 54,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clientBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121419',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F232B',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A73E8',
    marginRight: 8,
  },
  brandText: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractorHeaderBtn: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contractorHeaderBtnText: {
    fontFamily: fonts.displayBold,
    color: '#60A5FA',
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  contractorSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121722',
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#1A73E8',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  contractorSwitchCardPressed: {
    backgroundColor: '#162033',
    borderColor: '#2563EB',
  },
  switchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchIcon: {
    fontSize: 20,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  switchTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  tapToOpenPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  tapToOpenText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  switchSubtitle: {
    fontFamily: fonts.body,
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  switchArrow: {
    fontFamily: fonts.displayBold,
    color: '#60A5FA',
    fontSize: 16,
    paddingRight: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1116',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D212A',
    marginBottom: 18,
    gap: 14,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  rolePill: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontFamily: fonts.displayBold,
    color: '#60A5FA',
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  userContact: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12,
  },
  userPhone: {
    fontFamily: fonts.bodyMedium,
    color: '#5F636A',
    fontSize: 11.5,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111317',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232730',
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 13.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 11.5,
  },
  bookingCard: {
    backgroundColor: '#0F1116',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D212A',
    padding: 16,
    marginBottom: 24,
  },
  bookingStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontFamily: fonts.displayBold,
    color: '#10B981',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  bookingTime: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 12,
  },
  bookingTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  bookingContractor: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12,
    marginBottom: 12,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1D24',
  },
  bookingLocation: {
    fontFamily: fonts.body,
    color: '#5F636A',
    fontSize: 11.5,
  },
  bookingCost: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#0F1116',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D212A',
    padding: 14,
  },
  serviceCardPressed: {
    backgroundColor: '#151821',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceIcon: {
    fontSize: 22,
  },
  serviceTag: {
    backgroundColor: '#161922',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceTagText: {
    fontFamily: fonts.body,
    color: '#60A5FA',
    fontSize: 9.5,
  },
  serviceTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 4,
  },
  servicePros: {
    fontFamily: fonts.body,
    color: '#656B77',
    fontSize: 11,
  },
  footerNote: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  footerText: {
    fontFamily: fonts.body,
    color: '#5F636A',
    fontSize: 11,
  },

  // My Construction Sites Section
  clientSitesSection: {
    marginBottom: 26,
  },
  siteProjectCard: {
    backgroundColor: '#121620',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#202634',
    marginBottom: 14,
  },
  siteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientCodeBadge: {
    backgroundColor: '#1D2536',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2B384F',
  },
  clientCodeText: {
    fontFamily: fonts.displayBold,
    color: '#38BDF8',
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  siteProjectTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 4,
  },
  siteAddressText: {
    fontFamily: fonts.body,
    color: '#8E8E93',
    fontSize: 11.5,
    marginBottom: 14,
  },
  siteStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#0C0E14',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#181C26',
    marginBottom: 12,
  },
  siteStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  siteStatDivider: {
    width: 1,
    backgroundColor: '#1C212E',
  },
  siteStatLabel: {
    fontFamily: fonts.displayBold,
    color: '#636366',
    fontSize: 9.5,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  siteStatVal: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  siteTrack: {
    height: 5,
    backgroundColor: '#1C212E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  siteTrackFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  siteActionsRow: {
    flexDirection: 'row',
  },
  viewBillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  viewBillBtnText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 12,
  },
});
