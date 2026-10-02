import React, { useState, useCallback } from 'react';
import {
  useFonts,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
} from '@expo-google-fonts/ibm-plex-sans';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from './src/context/AuthContext';
import { ContractorProvider } from './src/context/ContractorContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import DiscordSplashScreen from './src/components/DiscordSplashScreen';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
  });

  // 1. Initial Splash Screen: Exclusively renders Servex Monogram 3D animation
  const [showSplash, setShowSplash] = useState(true);

  const handleFinishSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleReplaySplash = useCallback(() => {
    setShowSplash(true);
  }, []);

  // While fonts are loading, keep solid pitch-black screen to protect eyes
  if (!fontsLoaded) {
    return (
      <View style={styles.blackBg}>
        <StatusBar style="light" />
      </View>
    );
  }

  // Optional manual replay of splash screen triggered from within app
  if (showSplash) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <DiscordSplashScreen
          durationMs={4500}
          allowSkip={true}
          onFinish={handleFinishSplash}
        />
      </View>
    );
  }

  // 2. Main App: Rendered only once splash finishes
  return (
    <AuthProvider>
      <ContractorProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <RootNavigator onReplaySplash={handleReplaySplash} />
        </View>
      </ContractorProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blackBg: {
    flex: 1,
    backgroundColor: '#000000',
  },
});