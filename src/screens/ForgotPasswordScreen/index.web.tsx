import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

export const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');

  const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleRequestReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({ username: email });
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!confirmationCode || !newPassword || !confirmNewPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword,
      });
      
      // Navigate back to login screen on success
      navigation.navigate('Login' as never);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !loading) {
      if (step === 'request') {
        handleRequestReset();
      } else {
        handleConfirmReset();
      }
    }
  };

  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
            <Text variant="headlineMedium" style={styles.title}>
              Reset Password
            </Text>
            
            <Text variant="bodyMedium" style={styles.description}>
              Enter the verification code sent to {email} and your new password
            </Text>
            
            <TextInput
              label="Verification Code"
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              disabled={loading}
              autoFocus
            />
            
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
            
            <TextInput
              label="Confirm New Password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
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
              onPress={handleConfirmReset}
              loading={loading}
              style={styles.button}
            >
              Reset Password
            </Button>
            
            <Button
              mode="text"
              onPress={() => setStep('request')}
              disabled={loading}
              style={styles.textButton}
            >
              Didn't receive code? Try again
            </Button>
          </Surface>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineMedium" style={styles.title}>
            Forgot Password?
          </Text>
          
          <Text variant="bodyMedium" style={styles.description}>
            Enter your email address and we'll send you a verification code to reset your password
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
            onKeyPress={handleKeyPress}
          />
          
          {error ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleRequestReset}
            loading={loading}
            style={styles.button}
          >
            Send Reset Code
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.textButton}
          >
            Back to Sign In
          </Button>
        </Surface>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 10,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
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
});