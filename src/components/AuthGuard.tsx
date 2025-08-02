import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AuthGuardProps {
  children: React.ReactNode;
  requireFullAuth?: boolean;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireFullAuth = false,
  fallback 
}) => {
  const { isAuthenticated, isAnonymous } = useAuth();
  const navigation = useNavigation();

  // If we require full auth and user is anonymous, show upgrade prompt
  if (requireFullAuth && isAnonymous) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <MaterialCommunityIcons
              name="lock"
              size={64}
              color="#6200ee"
              style={styles.icon}
            />
            <Title style={styles.title}>Authentication Required</Title>
            <Paragraph style={styles.description}>
              This feature requires a full account. Please sign in or create an account to continue.
            </Paragraph>
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.button}
              >
                Sign In
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Register' as never)}
                style={styles.button}
              >
                Create Account
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // If user is not authenticated at all, redirect to auth
  if (!isAuthenticated && !isAnonymous) {
    useEffect(() => {
      navigation.navigate('Login' as never);
    }, []);
    
    return null;
  }

  // User is authenticated (either full or anonymous based on requirements)
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 2,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
});