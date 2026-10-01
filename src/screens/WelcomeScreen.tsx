import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../theme/tokens';
import { User } from '../types/auth';

const LOGO_IMAGE = require('../../assets/servex_logo.png');

export interface WelcomeScreenProps {
  /**
   * Triggers the Discord-style opening animation again.
   */
  onReplaySplash?: () => void;
  user?: User;
  onLogout?: () => void;
}

export default function WelcomeScreen({ onReplaySplash, user, onLogout }: WelcomeScreenProps) {
  const ctaScale = useMemo(() => new Animated.Value(1), []);
  const replayScale = useMemo(() => new Animated.Value(1), []);

  const onPressCtaIn = () =>
    Animated.spring(ctaScale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start();
  const onPressCtaOut = () =>
    Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  const onPressReplayIn = () =>
    Animated.spring(replayScale, { toValue: 0.93, useNativeDriver: true, friction: 6 }).start();
  const onPressReplayOut = () =>
    Animated.spring(replayScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

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
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BRAND HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.topBrandPill}>
            <View style={styles.topBrandDot} />
            <Text style={styles.topBrandText}>
              {user?.name ? `${user.name.toUpperCase()} • CONTRACTOR` : 'SERVEX CONTRACTOR • ONLINE'}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            {onReplaySplash && (
              <Pressable
                onPress={onReplaySplash}
                onPressIn={onPressReplayIn}
                onPressOut={onPressReplayOut}
                hitSlop={8}
              >
                <Animated.View
                  style={[styles.replayPill, { transform: [{ scale: replayScale }] }]}
                >
                  <Text style={styles.replayIcon}>⚡</Text>
                  <Text style={styles.replayText}>Replay</Text>
                </Animated.View>
              </Pressable>
            )}

            {onLogout && (
              <Pressable
                onPress={handleLogoutPress}
                style={styles.contractorLogoutPill}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Logout"
              >
                <Text style={styles.contractorLogoutText}>Logout</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* HERO SECTION WITH SX EMBLEM */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Image
              source={LOGO_IMAGE}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.heroTitle}>SERVEX</Text>
          <Text style={styles.heroTagline}>CONTRACTOR SUITE</Text>
          <Text style={styles.heroSubtitle}>
            Next-generation project management, real-time telemetry, and structural execution for modern builders.
          </Text>
        </View>

        {/* CORE CONTRACTOR MODULE CARDS */}
        <View style={styles.modulesGrid}>
          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🏗️</Text>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Active Job Sites</Text>
              <Text style={styles.moduleDesc}>3 projects on track • Live sync</Text>
            </View>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>📐</Text>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Blueprint Telemetry</Text>
              <Text style={styles.moduleDesc}>Real-time 5D specs & layout</Text>
            </View>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>⚡</Text>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Smart Estimates</Text>
              <Text style={styles.moduleDesc}>Instant materials & labor quote</Text>
            </View>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>📋</Text>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Daily Site Logs</Text>
              <Text style={styles.moduleDesc}>Crew safety & task verification</Text>
            </View>
          </View>
        </View>

        {/* BOTTOM CTA BUTTON */}
        <View style={styles.bottomCtaWrap}>
          <Pressable
            onPressIn={onPressCtaIn}
            onPressOut={onPressCtaOut}
            style={{ width: '100%' }}
          >
            <Animated.View
              style={[styles.cta, { transform: [{ scale: ctaScale }] }]}
            >
              <Text style={styles.ctaText}>Launch Workspace</Text>
              <Text style={styles.ctaArrow}>➔</Text>
            </Animated.View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Eye-friendly pitch black
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 54,
    paddingBottom: 36,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121419',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F232B',
  },
  topBrandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F5D4',
    marginRight: 8,
  },
  topBrandText: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  replayIcon: {
    color: '#EDEAE3',
    fontSize: 11,
    marginRight: 4,
  },
  replayText: {
    fontFamily: fonts.displayBold,
    color: '#EDEAE3',
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  contractorLogoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  contractorLogoutText: {
    fontFamily: fonts.displayBold,
    color: '#EF4444',
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    marginBottom: 20,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0A0B0E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroLogo: {
    width: 62,
    height: 62,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 28,
    letterSpacing: 3,
    marginBottom: 2,
  },
  heroTagline: {
    fontFamily: fonts.displayBold,
    color: '#C08552',
    fontSize: 12,
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    color: '#8A92A6',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modulesGrid: {
    width: '100%',
    maxWidth: 360,
    gap: 10,
    marginBottom: 24,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1116',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B1E26',
  },
  moduleIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontFamily: fonts.displayBold,
    color: '#EDEAE3',
    fontSize: 13.5,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  moduleDesc: {
    fontFamily: fonts.body,
    color: '#656B77',
    fontSize: 11.5,
  },
  bottomCtaWrap: {
    width: '100%',
    maxWidth: 360,
  },
  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaText: {
    fontFamily: fonts.displayBold,
    color: '#000000',
    fontSize: 15,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  ctaArrow: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
});