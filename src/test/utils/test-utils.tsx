import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock theme
const mockTheme = {
  colors: {
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f6f6f6',
    surface: '#ffffff',
    error: '#B00020',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#00000042',
    placeholder: '#00000054',
    backdrop: '#00000052',
    notification: '#f50057',
  },
  dark: false,
  roundness: 4,
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as '100',
    },
  },
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <NavigationContainer>
      <AuthProvider>
        <PaperProvider theme={mockTheme}>
          {children}
        </PaperProvider>
      </AuthProvider>
    </NavigationContainer>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Test data generators
export const createMockImage = (overrides = {}) => ({
  id: 'test-image-1',
  url: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  characterId: 'char-1',
  characterName: 'Test Character',
  categories: ['category1'],
  metadata: {
    ageRange: '18-25',
    nationality: 'US',
    bodyType: 'athletic',
  },
  status: 'approved',
  source: 'ai',
  promotionWeight: 1,
  voteCount: 100,
  winCount: 60,
  rating: 0.6,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockVote = (overrides = {}) => ({
  id: 'vote-1',
  voteId: 'vote-1',
  userId: 'user-1',
  winnerId: 'image-1',
  loserId: 'image-2',
  category: 'category1',
  sessionId: 'session-1',
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  preferences: {
    primaryPreference: 'category1',
    preferenceScore: 0.75,
  },
  stats: {
    totalVotes: 250,
    currentStreak: 5,
    longestStreak: 10,
    lastVoteDate: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Async utilities
export const waitForAsync = (ms: number = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock navigation props
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  setParams: jest.fn(),
});

export const createMockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});