import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ErrorHandler } from '@/utils/errorHandler';
import { offlineManager } from '@/services/offline/offlineManager';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

// Configure Amplify with Gen 2 outputs
Amplify.configure(outputs);

function AppContent() {
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Initialize error handler
    ErrorHandler.init();
    
    // Initialize offline manager
    offlineManager.init();
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      <OfflineIndicator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
