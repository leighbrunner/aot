import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
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

class AuthService {
  private currentAuthState: AuthState = {
    isAuthenticated: false,
    isAnonymous: false,
    userId: null,
    email: null,
    username: null,
  };

  async initializeAuth(): Promise<AuthState> {
    try {
      // Check for authenticated user
      const user = await getCurrentUser();
      if (user) {
        this.currentAuthState = {
          isAuthenticated: true,
          isAnonymous: false,
          userId: user.userId,
          email: user.signInDetails?.loginId || null,
          username: user.username,
        };
        return this.currentAuthState;
      }
    } catch (error) {
      // No authenticated user, check for anonymous session
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

  async convertAnonymousToRegistered(email: string, password: string): Promise<void> {
    if (!this.currentAuthState.isAnonymous) {
      throw new Error('User is not anonymous');
    }

    const anonymousId = this.currentAuthState.userId;
    
    try {
      // Sign up with email/password
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            'custom:previousAnonymousId': anonymousId || '',
          },
        },
      });
      
      // Clear anonymous session
      await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
      await AsyncStorage.removeItem(ANONYMOUS_SESSION_KEY);
      
      // Sign in with new credentials
      await signIn({ username: email, password });
      
      // Update auth state
      await this.initializeAuth();
    } catch (error) {
      console.error('Error converting anonymous user:', error);
      throw error;
    }
  }

  async signOutUser(): Promise<void> {
    try {
      if (this.currentAuthState.isAnonymous) {
        // Clear anonymous session
        await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
        await AsyncStorage.removeItem(ANONYMOUS_SESSION_KEY);
      } else {
        // Sign out authenticated user
        await signOut();
      }
      
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
      if (this.currentAuthState.isAnonymous) {
        // Return anonymous session ID as token
        return await AsyncStorage.getItem(ANONYMOUS_SESSION_KEY);
      }
      
      // Get authenticated user token
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
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
}

export const authService = new AuthService();