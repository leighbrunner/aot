// Platform-specific auth configuration
import { Platform } from 'react-native';

// Only import OAuth-related features on native platforms
export const isOAuthSupported = Platform.OS !== 'web';

// Export a safe auth configuration
export const authConfig = {
  oauth: isOAuthSupported ? {
    domain: 'your-domain.auth.ap-southeast-2.amazoncognito.com',
    scopes: ['email', 'profile', 'openid'],
    redirectSignIn: 'votingapp://',
    redirectSignOut: 'votingapp://',
    responseType: 'code'
  } : undefined
};