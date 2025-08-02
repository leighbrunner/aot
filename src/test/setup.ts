import '@testing-library/jest-native/extend-expect';
import { configure } from '@testing-library/react-native';

// Configure testing library
configure({
  asyncUtilTimeout: 5000,
});

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  forgotPassword: jest.fn(),
  forgotPasswordSubmit: jest.fn(),
  getCurrentUser: jest.fn(),
  fetchAuthSession: jest.fn(),
}));

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {
      Image: {
        observeQuery: jest.fn(() => ({
          subscribe: jest.fn(),
        })),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      Vote: {
        create: jest.fn(),
        list: jest.fn(),
      },
      User: {
        get: jest.fn(),
        update: jest.fn(),
      },
    },
  })),
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
  fromModule: jest.fn(() => ({ uri: 'mock-uri' })),
  downloadAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  manifest: {
    extra: {},
  },
  expoConfig: {
    extra: {},
  },
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
    Gesture: {
      Pan: jest.fn(() => ({
        onUpdate: jest.fn(() => ({ onEnd: jest.fn() })),
      })),
    },
    GestureDetector: View,
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

// Mock Zustand
jest.mock('zustand', () => {
  const actualZustand = jest.requireActual('zustand');
  const storeResetFns = new Set<() => void>();

  const create = (createState: any) => {
    const store = actualZustand.create(createState);
    const initialState = store.getState();
    
    storeResetFns.add(() => {
      store.setState(initialState, true);
    });
    
    return store;
  };

  return {
    create,
    storeResetFns,
  };
});

// Mock performance monitor
jest.mock('@/utils/performance/performanceMonitor', () => ({
  performanceMonitor: {
    trackScreenLoad: jest.fn((screenName, callback) => callback()),
    startTimer: jest.fn(),
    endTimer: jest.fn(() => 100),
    trackMetric: jest.fn(),
    getMetrics: jest.fn(() => ({})),
    reset: jest.fn(),
  },
}));

// Mock offline manager
jest.mock('@/utils/offline/offlineManager', () => ({
  offlineManager: {
    isOnline: jest.fn(() => true),
    queueOperation: jest.fn(),
    processPendingOperations: jest.fn(),
    clearQueue: jest.fn(),
    addNetworkListener: jest.fn(() => jest.fn()),
  },
}));

// Global fetch mock
global.fetch = jest.fn();

// Set up global test environment
global.__DEV__ = true;

// Global test utilities
global.mockNavigate = jest.fn();
global.mockGoBack = jest.fn();
global.mockDispatch = jest.fn();

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Reset stores after each test
afterEach(() => {
  const { storeResetFns } = require('zustand') as any;
  if (storeResetFns) {
    storeResetFns.forEach((fn: () => void) => fn());
  }
});