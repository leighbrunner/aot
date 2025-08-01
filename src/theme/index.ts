import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  customVariant: {
    fontFamily: 'System',
    fontWeight: 'normal' as const,
    letterSpacing: 0.5,
    lineHeight: 22,
    fontSize: 16,
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f6f6f6',
    surface: '#ffffff',
    error: '#b00020',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    secondary: '#03dac6',
    background: '#121212',
    surface: '#1e1e1e',
    error: '#cf6679',
  },
};