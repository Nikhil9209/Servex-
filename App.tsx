import React, { useState } from 'react';
import { useFonts, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WelcomeScreen from './src/screens/WelcomeScreen';
import DiscordSplashScreen from './src/components/DiscordSplashScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
  });

  const [showSplash, setShowSplash] = useState(true);

  // While fonts are loading, keep solid pitch-black screen to protect eyes
  if (!fontsLoaded) {
    return (
      <View style={styles.blackBg}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Main Contractor Application */}
      <WelcomeScreen onReplaySplash={() => setShowSplash(true)} />

      {/* 5-Second Discord-style Rotating Tool Splash Screen */}
      {showSplash && (
        <DiscordSplashScreen
          durationMs={5000}
          allowSkip={true}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </View>
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