// Web-specific auth service that doesn't use Amplify Auth
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_USER_KEY = 'anonymousUserId';
const ANONYMOUS_SESSION_KEY = 'anonymousSession';

export interface AuthState {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
}

class WebAuthService {
  private currentAuthState: AuthState = {
    isAuthenticated: false,
    isAnonymous: false,
    userId: null,
    email: null,
    username: null,
  };

  async initializeAuth(): Promise<AuthState> {
    try {
      // Check for anonymous session
      const anonymousId = await AsyncStorage.getItem(ANONYMOUS_USER_KEY);
      if (anonymousId) {
        this.currentAuthState = {
          isAuthenticated: true,
          isAnonymous: true,
          userId: anonymousId,
          email: null,
          username: `Guest_${anonymousId.substring(0, 8)}`,
        };
        return this.currentAuthState;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }

    // No user found
    this.currentAuthState = {
      isAuthenticated: false,
      isAnonymous: false,
      userId: null,
      email: null,
      username: null,
    };
    return this.currentAuthState;
  }

  async signInAnonymously(): Promise<AuthState> {
    try {
      // Generate anonymous user ID
      const anonymousId = uuidv4();
      const sessionId = uuidv4();
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(ANONYMOUS_USER_KEY, anonymousId);
      await AsyncStorage.setItem(ANONYMOUS_SESSION_KEY, sessionId);
      
      // Update auth state
      this.currentAuthState = {
        isAuthenticated: true,
        isAnonymous: true,
        userId: anonymousId,
        email: null,
        username: `Guest_${anonymousId.substring(0, 8)}`,
      };
      
      return this.currentAuthState;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  }

  async signInUser(email: string, password: string): Promise<AuthState> {
    throw new Error('Sign in not supported on web. Use anonymous mode.');
  }

  async signUpUser(email: string, password: string): Promise<AuthState> {
    throw new Error('Sign up not supported on web. Use anonymous mode.');
  }

  async resetPassword(email: string): Promise<void> {
    throw new Error('Password reset not supported on web.');
  }

  async signOutUser(): Promise<void> {
    try {
      // Clear anonymous session
      await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
      await AsyncStorage.removeItem(ANONYMOUS_SESSION_KEY);
      
      // Reset auth state
      this.currentAuthState = {
        isAuthenticated: false,
        isAnonymous: false,
        userId: null,
        email: null,
        username: null,
      };
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      // Return anonymous session ID as token
      return await AsyncStorage.getItem(ANONYMOUS_SESSION_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  getCurrentAuthState(): AuthState {
    return { ...this.currentAuthState };
  }

  isAuthenticated(): boolean {
    return this.currentAuthState.isAuthenticated;
  }

  isAnonymous(): boolean {
    return this.currentAuthState.isAnonymous;
  }

  // Stub methods for compatibility
  async convertAnonymousToRegistered(email: string, password: string): Promise<void> {
    throw new Error('Account conversion not supported on web.');
  }
}

export const authService = new WebAuthService();