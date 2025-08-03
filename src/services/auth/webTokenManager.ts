// Web-specific token manager that doesn't use Amplify
import { authService } from './webAuthService';

class WebTokenManager {
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  init() {
    // For web, we're using simple anonymous auth
    // No token refresh needed
    console.log('Web token manager initialized');
  }

  async getValidToken(): Promise<string | null> {
    try {
      // Get the anonymous session token
      return await authService.getAuthToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  cleanup() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
}

export const tokenManager = new WebTokenManager();