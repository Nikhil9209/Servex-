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

interface ClientHomeScreenProps {
  user: User;
  onLogout: () => void;
}

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({ user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');

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
            <Text style={styles.userPhone}>Verified: {formattedPhone}</Text>
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
});
