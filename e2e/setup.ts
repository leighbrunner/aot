import { device, init, cleanup } from 'detox';

// Detox configuration
beforeAll(async () => {
  await init({
    launchApp: false,
  });
  
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      photos: 'YES',
    },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await cleanup();
});

// Global test helpers
global.waitForElement = async (testID: string, timeout = 5000) => {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .withTimeout(timeout);
};

global.tapElement = async (testID: string) => {
  await element(by.id(testID)).tap();
};

global.typeText = async (testID: string, text: string) => {
  await element(by.id(testID)).typeText(text);
};

global.scrollToElement = async (testID: string, scrollViewTestID: string) => {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .whileElement(by.id(scrollViewTestID))
    .scroll(500, 'down');
};

global.swipeElement = async (testID: string, direction: 'up' | 'down' | 'left' | 'right') => {
  await element(by.id(testID)).swipe(direction);
};

// Test data helpers
global.testUser = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
};

global.generateRandomEmail = () => {
  const timestamp = Date.now();
  return `e2e-test-${timestamp}@example.com`;
};

// App-specific helpers
global.signIn = async (email: string, password: string) => {
  await tapElement('tab-profile');
  await tapElement('sign-in-button');
  await typeText('email-input', email);
  await typeText('password-input', password);
  await tapElement('submit-button');
  await waitForElement('profile-screen', 10000);
};

global.signOut = async () => {
  await tapElement('tab-profile');
  await scrollToElement('sign-out-button', 'profile-scroll-view');
  await tapElement('sign-out-button');
  await tapElement('confirm-sign-out');
  await waitForElement('sign-in-button');
};

global.submitVote = async (side: 'left' | 'right') => {
  await waitForElement('voting-card-left');
  await waitForElement('voting-card-right');
  await tapElement(`vote-button-${side}`);
  
  // Wait for next pair to load
  await waitFor(element(by.id('voting-card-left')))
    .toBeVisible()
    .withTimeout(5000);
};