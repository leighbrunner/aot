import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
  const emailRef = useRef<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-focus email field on web
    setTimeout(() => {
      emailRef.current?.focus();
    }, 100);
  }, []);

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

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !loading) {
      handleConvert();
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Card */}
          <Card style={styles.headerCard}>
            <Card.Content style={styles.headerContent}>
              <MaterialCommunityIcons
                name="account-convert"
                size={64}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Title style={styles.title}>Convert to Full Account</Title>
              <Paragraph style={styles.description}>
                Create a permanent account to secure your voting history and unlock all features
              </Paragraph>
            </Card.Content>
          </Card>

          {/* Benefits Section */}
          <View style={styles.benefitsContainer}>
            <Title style={styles.benefitsTitle}>Why Convert Your Account?</Title>
            <View style={styles.benefitsGrid}>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="history"
                  size={48}
                  color={theme.colors.primary}
                />
                <Text style={styles.benefitTitle}>Keep Your History</Text>
                <Text style={styles.benefitDescription}>
                  All your votes and statistics will be preserved
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="devices"
                  size={48}
                  color={theme.colors.primary}
                />
                <Text style={styles.benefitTitle}>Access Anywhere</Text>
                <Text style={styles.benefitDescription}>
                  Sign in on any device to continue voting
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialCommunityIcons
                  name="star"
                  size={48}
                  color={theme.colors.primary}
                />
                <Text style={styles.benefitTitle}>Advanced Features</Text>
                <Text style={styles.benefitDescription}>
                  Unlock detailed analytics and personalization
                </Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Card.Content>
              <TextInput
                ref={emailRef}
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
                onKeyPress={handleKeyPress}
                autoFocus
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
                onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
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
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleConvert}
              loading={loading}
              disabled={loading}
              style={styles.convertButton}
              contentStyle={styles.buttonContent}
            >
              Convert Account
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Maybe Later
            </Button>
          </View>
        </View>
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
    alignItems: 'center',
    paddingVertical: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: 16,
  },
  headerCard: {
    marginBottom: 32,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 500,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  benefitItem: {
    alignItems: 'center',
    padding: 16,
    maxWidth: 250,
    minWidth: 200,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  formCard: {
    marginBottom: 32,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  passwordStrengthContainer: {
    marginTop: -12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  passwordStrength: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  convertButton: {
    minWidth: 150,
  },
  cancelButton: {
    minWidth: 150,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});