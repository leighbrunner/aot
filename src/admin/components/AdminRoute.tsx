import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, Button, Surface } from 'react-native-paper';
import { useAuthContext } from '../../contexts/AuthContext';
import { Auth } from 'aws-amplify';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Get the current user session
      const session = await Auth.currentSession();
      const groups = session.getAccessToken().payload['cognito:groups'] || [];
      
      // Check if user is in Admin group
      const hasAdminAccess = groups.includes('Admin');
      setIsAdmin(hasAdminAccess);
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Surface style={styles.errorCard} elevation={2}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Authentication Required
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            Please sign in to access the admin dashboard.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => {
              // Navigate to login
              console.log('Navigate to login');
            }}
            style={styles.button}
          >
            Sign In
          </Button>
        </Surface>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Surface style={styles.errorCard} elevation={2}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Access Denied
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            You don't have permission to access this area.
          </Text>
          <Text variant="bodySmall" style={styles.helpText}>
            If you believe this is an error, please contact support.
          </Text>
        </Surface>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
  },
  errorCard: {
    padding: 24,
    borderRadius: 12,
    maxWidth: 400,
    width: '90%',
    alignItems: 'center',
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  helpText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.6,
  },
  button: {
    marginTop: 16,
  },
});