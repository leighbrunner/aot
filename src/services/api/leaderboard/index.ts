// Platform-specific leaderboard API selector
import { Platform } from 'react-native';

// Use web leaderboard API for web platform to avoid Amplify imports
const leaderboardAPI = Platform.OS === 'web' 
  ? require('../webLeaderboard').leaderboardAPI
  : require('../leaderboard').leaderboardAPI;

export { leaderboardAPI };
export type { LeaderboardItem, LeaderboardQuery, Period, CountryStats } from '../webLeaderboard';