import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ErrorHandler } from '@/utils/errorHandler';
import { offlineManager } from '@/services/offline/offlineManager';
import { tokenManager } from '@/services/auth/tokenManager/index';

// Configure Amplify based on platform
if (Platform.OS === 'web') {
  require('@/config/amplify.web');
} else {
  require('@/config/amplify');
}

function AppContent() {
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Initialize error handler
    ErrorHandler.init();
    
    // Initialize offline manager
    offlineManager.init();
    
    // Initialize token manager
    tokenManager.init();
    
    // Cleanup on unmount
    return () => {
      tokenManager.cleanup();
    };
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
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
