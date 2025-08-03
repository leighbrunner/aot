// Platform-specific auth service selector
import { Platform } from 'react-native';

// Use web auth service for web platform to avoid OAuth issues
const authService = Platform.OS === 'web' 
  ? require('./webAuthService').authService
  : require('./authService').authService;

export { authService };
export type { AuthState } from './webAuthService';