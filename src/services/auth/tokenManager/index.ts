// Platform-specific token manager selector
import { Platform } from 'react-native';

// Use web token manager for web platform to avoid Amplify imports
const tokenManager = Platform.OS === 'web' 
  ? require('../webTokenManager').tokenManager
  : require('../tokenManager').tokenManager;

export { tokenManager };