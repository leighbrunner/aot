import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Surface, TextInput, Button, Text, useTheme, Divider, IconButton, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import { useAuth } from '@/contexts/AuthContext';
import { biometricAuthService } from '@/services/auth/biometricAuth';
import { tokenManager } from '@/services/auth/tokenManager';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { signInAnonymously } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    checkStoredCredentials();
  }, []);

  const checkBiometricAvailability = async () => {
    await biometricAuthService.init();
    const isEnabled = await biometricAuthService.isBiometricEnabled();
    setBiometricAvailable(isEnabled);
  };

  const checkStoredCredentials = async () => {
    // Check if biometric login is available
    const credentials = await biometricAuthService.getStoredCredentials();
    if (credentials) {
      // Automatically prompt for biometric login
      handleBiometricLogin();
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await biometricAuthService.authenticate('Sign in with biometrics');
      if (result.success) {
        const credentials = await biometricAuthService.getStoredCredentials();
        if (credentials) {
          // Use stored secure token to sign in
          await signIn({ 
            username: credentials.username, 
            password: credentials.secureToken 
          });
        }
      } else {
        setError(result.error || 'Biometric authentication failed');
      }
    } catch (err: any) {
      setError('Biometric login failed. Please use password.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn({ username: email, password });
      
      // Check if we should prompt to enable biometric
      if (rememberMe && Platform.OS !== 'web') {
        const shouldPrompt = await biometricAuthService.promptToEnableBiometric();
        if (shouldPrompt) {
          Alert.alert(
            'Enable Biometric Login',
            `Would you like to enable ${biometricAuthService.getBiometricTypeString()} for faster sign in?`,
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  // Create a secure token for biometric login
                  const token = await tokenManager.getValidToken();
                  if (token) {
                    await biometricAuthService.enableBiometric({
                      username: email,
                      secureToken: token,
                    });
                  }
                },
              },
            ]
          );
        }
      }
      
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

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />
          
          {Platform.OS !== 'web' && (
            <View style={styles.rememberMeContainer}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading}
              />
              <Text 
                style={styles.rememberMeText}
                onPress={() => setRememberMe(!rememberMe)}
              >
                Remember me
              </Text>
            </View>
          )}
          
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
          
          {biometricAvailable && Platform.OS !== 'web' && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              loading={loading}
              style={styles.biometricButton}
              icon={() => (
                <MaterialCommunityIcons 
                  name="fingerprint" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              )}
            >
              Sign in with {biometricAuthService.getBiometricTypeString()}
            </Button>
          )}
          
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
            />
            <IconButton
              icon="facebook"
              mode="outlined"
              size={30}
              onPress={() => handleSocialLogin('Facebook')}
              disabled={loading}
            />
            <IconButton
              icon="apple"
              mode="outlined"
              size={30}
              onPress={() => handleSocialLogin('Apple')}
              disabled={loading}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  surface: {
    margin: 20,
    padding: 20,
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
    marginBottom: 20,
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
  anonymousButton: {
    marginTop: 10,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: -5,
  },
  rememberMeText: {
    marginLeft: 8,
  },
  biometricButton: {
    marginTop: 10,
  },
});