import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { GradientBackground } from '../components/GradientBackground';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';

// A dark navigation theme so the brief flash between screens (and the
// area behind any translucent header) is this app's purple-black, not
// react-navigation's default white — that white flash was the most
// visible "this isn't finished" tell in the previous pass.
const AppNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgDeepest,
    card: colors.bgDeepest,
    primary: colors.primary,
    text: colors.textPrimary,
    border: colors.border,
  },
};

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { palette } = useTheme();

  // Only shown during the one-time silent-re-login check on app start
  // (see AuthContext) — never shown again after that resolves either way.
  if (isLoading) {
    return (
      <GradientBackground style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </GradientBackground>
    );
  }

  const navigationTheme: Theme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: palette.background, card: palette.surface, primary: palette.primary, text: palette.textPrimary, border: palette.border },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
