import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/AuthLoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { ClientHomeScreen } from '../screens/client/ClientHomeScreen';
import { ContractorHomeScreen } from '../screens/contractor/ContractorHomeScreen';

interface RootNavigatorProps {
  onReplaySplash?: () => void;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ onReplaySplash }) => {
  const { user, isAuthenticated, isLoading, logout, switchUserRole } = useAuth();

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
        <ContractorHomeScreen
          user={user}
          onLogout={logout}
          onReplaySplash={onReplaySplash}
          onSwitchRole={switchUserRole}
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
