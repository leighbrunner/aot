import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Card,
  Title,
  Paragraph,
  HelperText,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ConvertAccountScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { convertToRegistered, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setError('');
    return true;
  };

  const handleConvert = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await convertToRegistered(email, password);
      Alert.alert(
        'Success',
        'Your account has been converted successfully! All your voting history has been preserved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      console.error('Convert account error:', err);
      if (err.code === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else {
        setError(err.message || 'Failed to convert account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): { label: string; color: string } => {
    if (!password) return { label: '', color: theme.colors.outline };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: theme.colors.error };
    if (strength <= 3) return { label: 'Fair', color: theme.colors.tertiary };
    if (strength <= 4) return { label: 'Good', color: theme.colors.primary };
    return { label: 'Strong', color: theme.colors.primary };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <MaterialCommunityIcons
              name="account-convert"
              size={48}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Title style={styles.title}>Convert to Full Account</Title>
            <Paragraph style={styles.description}>
              Create a permanent account to secure your voting history and unlock all features
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Benefits Card */}
        <Card style={styles.benefitsCard}>
          <Card.Content>
            <Title style={styles.benefitsTitle}>Why Convert?</Title>
            <List.Section>
              <List.Item
                title="Keep Your History"
                description="All your votes and statistics will be preserved"
                left={props => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
              />
              <List.Item
                title="Access Anywhere"
                description="Sign in on any device to continue voting"
                left={props => <List.Icon {...props} icon="devices" color={theme.colors.primary} />}
              />
              <List.Item
                title="Advanced Features"
                description="Unlock detailed analytics and personalization"
                left={props => <List.Icon {...props} icon="star" color={theme.colors.primary} />}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Form Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              disabled={loading}
              error={!!error && error.includes('email')}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              disabled={loading}
              error={!!error && error.includes('Password')}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {password && (
              <View style={styles.passwordStrengthContainer}>
                <Text style={[styles.passwordStrength, { color: passwordStrength.color }]}>
                  Password Strength: {passwordStrength.label}
                </Text>
              </View>
            )}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              disabled={loading}
              error={!!error && error.includes('match')}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            {error ? (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Button
          mode="contained"
          onPress={handleConvert}
          loading={loading}
          disabled={loading}
          style={styles.convertButton}
        >
          Convert Account
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={styles.cancelButton}
        >
          Maybe Later
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
  },
  benefitsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  formCard: {
    marginBottom: 24,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  passwordStrengthContainer: {
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  passwordStrength: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 4,
  },
  convertButton: {
    marginBottom: 12,
  },
  cancelButton: {
    opacity: 0.7,
  },
});