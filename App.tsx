import React from 'react';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// One QueryClient for the whole app's lifetime — created outside the
// component so it survives re-renders (creating it inline in the
// component body would reset the entire cache on every render).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // the backend's own errors are usually not transient (validation, auth) — one retry, not react-query's default 3
    },
  },
});


function ThemeStatusBar() {
  const { isMidnight } = useTheme();
  return <StatusBar style={isMidnight ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ThemeProvider>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootNavigator />
          <ThemeStatusBar />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}
