// Empty auth module for Amplify auth imports on web platform
export const signIn = () => Promise.reject(new Error('Auth not supported on web'));
export const signUp = () => Promise.reject(new Error('Auth not supported on web'));
export const signOut = () => Promise.resolve();
export const confirmSignUp = () => Promise.reject(new Error('Auth not supported on web'));
export const resendSignUpCode = () => Promise.reject(new Error('Auth not supported on web'));
export const resetPassword = () => Promise.reject(new Error('Auth not supported on web'));
export const confirmResetPassword = () => Promise.reject(new Error('Auth not supported on web'));
export const fetchAuthSession = () => Promise.resolve({ tokens: null });
export const getCurrentUser = () => Promise.reject(new Error('Auth not supported on web'));

// OAuth specific exports
export const signInWithRedirect = () => Promise.reject(new Error('OAuth not supported on web'));
export const fetchUserAttributes = () => Promise.reject(new Error('Auth not supported on web'));

// Default export
export default {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
  fetchUserAttributes,
};