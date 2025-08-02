import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, TextInput, Button, Text, useTheme, Divider, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import { useAuth } from '@/contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signInAnonymously } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn({ username: email, password });
      // Navigation will be handled by auth state change
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Facebook' | 'Apple') => {
    try {
      await signInWithRedirect({ provider });
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously();
      // Navigation will be handled by auth state change in RootNavigator
    } catch (err: any) {
      setError(err.message || 'Failed to continue anonymously');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !loading) {
      handleEmailLogin();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back
          </Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            disabled={loading}
            autoFocus
            onSubmitEditing={() => {/* Focus password field */}}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            disabled={loading}
            onKeyPress={handleKeyPress}
          />
          
          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleEmailLogin}
            loading={loading}
            style={styles.button}
          >
            Sign In
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            disabled={loading}
            style={styles.textButton}
          >
            Forgot Password?
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('Register' as never)}
            disabled={loading}
            style={styles.textButton}
          >
            Don't have an account? Sign Up
          </Button>
          
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.orText}>
            Or continue with
          </Text>
          
          <View style={styles.socialButtons}>
            <IconButton
              icon="google"
              mode="outlined"
              size={30}
              onPress={() => handleSocialLogin('Google')}
              disabled={loading}
              style={styles.socialButton}
            />
            <IconButton
              icon="facebook"
              mode="outlined"
              size={30}
              onPress={() => handleSocialLogin('Facebook')}
              disabled={loading}
              style={styles.socialButton}
            />
            <IconButton
              icon="apple"
              mode="outlined"
              size={30}
              onPress={() => handleSocialLogin('Apple')}
              disabled={loading}
              style={styles.socialButton}
            />
          </View>
          
          <Button
            mode="outlined"
            onPress={handleAnonymousLogin}
            loading={loading && !email && !password}
            style={styles.anonymousButton}
          >
            Continue as Guest
          </Button>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  surface: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
  textButton: {
    marginBottom: 10,
  },
  error: {
    textAlign: 'center',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 20,
  },
  orText: {
    textAlign: 'center',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialButton: {
    marginHorizontal: 5,
  },
  anonymousButton: {
    marginTop: 10,
  },
});