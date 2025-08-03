// Platform-specific realtime service selector
import { Platform } from 'react-native';

// Use web realtime service for web platform to avoid Amplify imports
const realtimeService = Platform.OS === 'web' 
  ? require('./webRealtimeService').realtimeService
  : require('./realtimeService').realtimeService;

export { realtimeService };
export type { VoteActivitySubscription, StatsUpdateSubscription } from './webRealtimeService';