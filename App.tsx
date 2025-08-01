import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';

function AppContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <>
      <AppNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
