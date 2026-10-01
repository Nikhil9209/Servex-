import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fonts } from '../theme/tokens';
import { ServexLogo } from './ServexLogo';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <ServexLogo size={56} showBadge={true} />
        <Text style={styles.brandTitle}>SERVEX</Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#1A73E8" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: 3,
    marginTop: 18,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
