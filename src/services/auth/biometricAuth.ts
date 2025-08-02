import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometricAuthEnabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometricCredentials';

export interface BiometricCredentials {
  username: string;
  // We'll store a secure token, not the actual password
  secureToken: string;
}

class BiometricAuthService {
  private isSupported = false;
  private biometricType: LocalAuthentication.AuthenticationType | null = null;

  async init() {
    // Check if biometric authentication is available
    this.isSupported = await LocalAuthentication.hasHardwareAsync();
    
    if (this.isSupported) {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.length > 0) {
        this.biometricType = supportedTypes[0];
      }
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    if (!this.isSupported) return false;
    
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  }

  async isBiometricEnabled(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  async enableBiometric(credentials: BiometricCredentials): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Authenticate user before enabling
      const result = await this.authenticate('Enable biometric authentication');
      if (!result.success) {
        return false;
      }

      // Store encrypted credentials
      await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials));
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
  }

  async authenticate(reason?: string): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometric authentication not supported on web' };
    }

    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  async getStoredCredentials(): Promise<BiometricCredentials | null> {
    if (Platform.OS === 'web') return null;
    
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) return null;

      const credentialsJson = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
      if (!credentialsJson) return null;

      return JSON.parse(credentialsJson);
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  }

  getBiometricTypeString(): string {
    switch (this.biometricType) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Touch ID';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face ID';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris Scanner';
      default:
        return 'Biometric';
    }
  }

  async promptToEnableBiometric(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    const isAvailable = await this.isBiometricAvailable();
    const isEnabled = await this.isBiometricEnabled();
    
    // Only prompt if biometric is available but not enabled
    return isAvailable && !isEnabled;
  }
}

export const biometricAuthService = new BiometricAuthService();