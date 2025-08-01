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
import { config } from '@/config/env';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.COGNITO_USER_POOL_ID,
      userPoolClientId: config.COGNITO_CLIENT_ID,
      identityPoolId: config.COGNITO_IDENTITY_POOL_ID,
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: config.COGNITO_DOMAIN,
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: ['voting-app://'],
          redirectSignOut: ['voting-app://'],
          responseType: 'code',
        },
      },
    },
  },
  Storage: {
    S3: {
      bucket: config.S3_BUCKET,
      region: config.AWS_REGION,
    },
  },
});

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
