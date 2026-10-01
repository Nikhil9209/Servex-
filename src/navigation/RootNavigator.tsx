import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/AuthLoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { ClientHomeScreen } from '../screens/client/ClientHomeScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import DiscordSplashScreen from '../components/DiscordSplashScreen';

export const RootNavigator: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(false);

  // 1. Initial Authentication Check Loading Screen
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // 2. Unauthenticated: Strictly enforce Auth Navigator (No guest, no bypass, no skip)
  if (!isAuthenticated || !user) {
    return <AuthNavigator />;
  }

  // 3. Authenticated: Render protected application according to role
  return (
    <View style={styles.container}>
      {user.role === 'client' ? (
        <ClientHomeScreen user={user} onLogout={logout} />
      ) : (
        <WelcomeScreen
          user={user}
          onLogout={logout}
          onReplaySplash={() => setShowSplash(true)}
        />
      )}

      {/* Servex Emblem Splash Animation */}
      {showSplash && (
        <DiscordSplashScreen
          durationMs={5000}
          allowSkip={true}
          onFinish={() => setShowSplash(false)}
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
});
