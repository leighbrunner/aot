import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = isIOS || isAndroid;

// Helper to conditionally use components based on platform
export const platformSelect = <T>(options: {
  web?: T;
  native?: T;
  ios?: T;
  android?: T;
  default: T;
}): T => {
  if (isWeb && options.web !== undefined) return options.web;
  if (isIOS && options.ios !== undefined) return options.ios;
  if (isAndroid && options.android !== undefined) return options.android;
  if (isNative && options.native !== undefined) return options.native;
  return options.default;
};