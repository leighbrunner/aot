import { Hub } from 'aws-amplify/utils';
import { fetchAuthSession } from 'aws-amplify/auth';

class TokenManager {
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  init() {
    // Listen for auth events
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signIn':
          console.log('User signed in');
          this.scheduleTokenRefresh();
          break;
        case 'signOut':
          console.log('User signed out');
          this.clearTokenRefreshTimer();
          break;
        case 'tokenRefresh':
          console.log('Token refreshed');
          this.scheduleTokenRefresh();
          break;
        case 'tokenRefresh_failure':
          console.error('Token refresh failed', data.payload.data);
          this.handleTokenRefreshFailure();
          break;
      }
    });

    // Check if user is already signed in and schedule refresh
    this.checkAndScheduleRefresh();
  }

  private async checkAndScheduleRefresh() {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        this.scheduleTokenRefresh();
      }
    } catch (error) {
      console.log('No active session');
    }
  }

  private async scheduleTokenRefresh() {
    // Clear any existing timer
    this.clearTokenRefreshTimer();

    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) return;

      // Get token expiration time
      const idToken = session.tokens.idToken;
      const payload = idToken.payload;
      const exp = payload.exp as number;
      
      if (!exp) return;

      // Calculate time until expiration (in milliseconds)
      const expirationTime = exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Refresh 5 minutes before expiration
      const refreshTime = timeUntilExpiration - (5 * 60 * 1000);

      if (refreshTime > 0) {
        console.log(`Scheduling token refresh in ${refreshTime / 1000 / 60} minutes`);
        
        this.tokenRefreshTimer = setTimeout(async () => {
          await this.refreshToken();
        }, refreshTime);
      } else {
        // Token is about to expire or already expired, refresh immediately
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  private async refreshToken() {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    try {
      console.log('Refreshing token...');
      // Force refresh by fetching auth session with forceRefresh
      await fetchAuthSession({ forceRefresh: true });
      console.log('Token refreshed successfully');
      
      // Schedule next refresh
      this.scheduleTokenRefresh();
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.handleTokenRefreshFailure();
    } finally {
      this.isRefreshing = false;
    }
  }

  private handleTokenRefreshFailure() {
    // Clear timer
    this.clearTokenRefreshTimer();
    
    // Emit event for app to handle (e.g., show re-login prompt)
    Hub.dispatch('auth', {
      event: 'tokenRefreshFailed',
      data: { message: 'Session expired. Please sign in again.' },
    });
  }

  private clearTokenRefreshTimer() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  async getValidToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        return null;
      }

      // Check if token is expired
      const idToken = session.tokens.idToken;
      const payload = idToken.payload;
      const exp = payload.exp as number;
      const currentTime = Math.floor(Date.now() / 1000);

      if (exp && exp < currentTime) {
        // Token is expired, try to refresh
        const refreshedSession = await fetchAuthSession({ forceRefresh: true });
        return refreshedSession.tokens?.idToken?.toString() || null;
      }

      return idToken.toString();
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  cleanup() {
    this.clearTokenRefreshTimer();
  }
}

export const tokenManager = new TokenManager();