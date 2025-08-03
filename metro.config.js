const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure web support
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Prioritize CommonJS modules over ESM to avoid import.meta issues
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// Configure platform-specific module resolution
config.resolver.platforms = ['ios', 'android', 'web'];

// Custom resolver to handle OAuth modules on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block OAuth-related imports on web
  if (platform === 'web' && 
      (moduleName.includes('oauth') || 
       moduleName.includes('signInWithRedirect') ||
       moduleName.includes('enableOAuthListener') ||
       moduleName.includes('ADD_OAUTH_LISTENER'))) {
    // Return empty module for OAuth on web
    return {
      filePath: path.resolve(__dirname, 'src/utils/empty-module.js'),
      type: 'sourceFile',
    };
  }
  
  // Also handle specific Amplify auth imports
  if (platform === 'web' && moduleName.includes('aws-amplify/auth')) {
    return {
      filePath: path.resolve(__dirname, 'src/utils/empty-auth-module.js'),
      type: 'sourceFile',
    };
  }
  
  // Use default resolution for other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;