const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web support
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Prioritize CommonJS modules over ESM to avoid import.meta issues
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;