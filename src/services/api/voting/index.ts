// Platform-specific voting API selector
import { Platform } from 'react-native';

// Use web voting API for web platform to avoid Amplify imports
const votingAPI = Platform.OS === 'web' 
  ? require('../webVoting').votingAPI
  : require('../voting').votingAPI;

export { votingAPI };
export type { ImagePair, VoteResult, ImagePairResponse } from '../webVoting';