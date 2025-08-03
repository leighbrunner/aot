// Empty module for OAuth imports on web platform
export default {};
export const enableOAuthListener = () => {};
export const ADD_OAUTH_LISTENER = () => {};
export const signInWithRedirect = () => Promise.reject(new Error('OAuth not supported on web'));
export const signOut = () => Promise.resolve();