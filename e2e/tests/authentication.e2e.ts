import { by, element, expect, device, waitFor } from 'detox';

describe('Authentication E2E Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await tapElement('tab-profile');
  });

  describe('Sign Up Flow', () => {
    it('should complete sign up process', async () => {
      const testEmail = generateRandomEmail();

      // Navigate to sign up
      await tapElement('sign-in-button');
      await tapElement('create-account-link');

      // Fill sign up form
      await typeText('email-input', testEmail);
      await typeText('password-input', 'TestPassword123!');
      await typeText('confirm-password-input', 'TestPassword123!');
      
      // Submit
      await tapElement('sign-up-button');

      // Wait for confirmation screen
      await waitForElement('confirmation-screen', 10000);

      // Enter confirmation code (in real test, would need to retrieve this)
      await typeText('confirmation-code-input', '123456');
      await tapElement('confirm-button');

      // Should be signed in
      await waitForElement('profile-screen');
      await expect(element(by.text(testEmail))).toBeVisible();
    });

    it('should validate password requirements', async () => {
      await tapElement('sign-in-button');
      await tapElement('create-account-link');

      // Try weak password
      await typeText('email-input', generateRandomEmail());
      await typeText('password-input', 'weak');

      // Should show password requirements
      await expect(element(by.text(/at least 8 characters/i))).toBeVisible();
      await expect(element(by.text(/uppercase letter/i))).toBeVisible();
      await expect(element(by.text(/number/i))).toBeVisible();
      await expect(element(by.text(/special character/i))).toBeVisible();

      // Sign up button should be disabled
      await expect(element(by.id('sign-up-button'))).toHaveLabel('Sign up button disabled');
    });

    it('should handle duplicate email error', async () => {
      await tapElement('sign-in-button');
      await tapElement('create-account-link');

      // Use existing email
      await typeText('email-input', global.testUser.email);
      await typeText('password-input', 'TestPassword123!');
      await typeText('confirm-password-input', 'TestPassword123!');
      
      await tapElement('sign-up-button');

      // Should show error
      await waitForElement('error-message');
      await expect(element(by.text(/already exists/i))).toBeVisible();
    });
  });

  describe('Sign In Flow', () => {
    it('should sign in with valid credentials', async () => {
      await tapElement('sign-in-button');

      await typeText('email-input', global.testUser.email);
      await typeText('password-input', global.testUser.password);
      
      await tapElement('submit-button');

      // Should navigate to profile
      await waitForElement('profile-screen', 10000);
      await expect(element(by.text(global.testUser.email))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await tapElement('sign-in-button');

      await typeText('email-input', global.testUser.email);
      await typeText('password-input', 'WrongPassword123!');
      
      await tapElement('submit-button');

      // Should show error
      await waitForElement('error-message');
      await expect(element(by.text(/incorrect/i))).toBeVisible();
    });

    it('should remember user preference', async () => {
      await tapElement('sign-in-button');

      // Check remember me
      await tapElement('remember-me-checkbox');

      await typeText('email-input', global.testUser.email);
      await typeText('password-input', global.testUser.password);
      
      await tapElement('submit-button');

      await waitForElement('profile-screen');

      // Sign out
      await signOut();

      // Navigate back to sign in
      await tapElement('sign-in-button');

      // Email should be pre-filled
      await expect(element(by.id('email-input'))).toHaveText(global.testUser.email);
    });
  });

  describe('Forgot Password Flow', () => {
    it('should reset password', async () => {
      await tapElement('sign-in-button');
      await tapElement('forgot-password-link');

      // Enter email
      await typeText('email-input', global.testUser.email);
      await tapElement('send-code-button');

      // Wait for code screen
      await waitForElement('reset-code-screen');

      // Enter code (in real test, would need to retrieve this)
      await typeText('reset-code-input', '123456');
      await typeText('new-password-input', 'NewPassword123!');
      await typeText('confirm-new-password-input', 'NewPassword123!');

      await tapElement('reset-password-button');

      // Should show success and redirect to sign in
      await waitForElement('password-reset-success');
      await tapElement('sign-in-now-button');

      // Should be able to sign in with new password
      await typeText('email-input', global.testUser.email);
      await typeText('password-input', 'NewPassword123!');
      await tapElement('submit-button');

      await waitForElement('profile-screen');
    });

    it('should handle invalid reset code', async () => {
      await tapElement('sign-in-button');
      await tapElement('forgot-password-link');

      await typeText('email-input', global.testUser.email);
      await tapElement('send-code-button');

      await waitForElement('reset-code-screen');

      // Enter wrong code
      await typeText('reset-code-input', '000000');
      await typeText('new-password-input', 'NewPassword123!');
      await typeText('confirm-new-password-input', 'NewPassword123!');

      await tapElement('reset-password-button');

      // Should show error
      await waitForElement('error-message');
      await expect(element(by.text(/invalid code/i))).toBeVisible();
    });
  });

  describe('Social Sign In', () => {
    it('should show social sign in options', async () => {
      await tapElement('sign-in-button');

      // Verify social buttons are visible
      await expect(element(by.id('google-sign-in-button'))).toBeVisible();
      await expect(element(by.id('facebook-sign-in-button'))).toBeVisible();
      await expect(element(by.id('apple-sign-in-button'))).toBeVisible();
    });

    // Note: Actual social sign in testing would require additional setup
    // and mocking of native social auth SDKs
  });

  describe('Anonymous to Authenticated Conversion', () => {
    it('should preserve voting data when converting from anonymous', async () => {
      // Vote as anonymous
      await tapElement('tab-voting');
      await submitVote('left');
      await submitVote('right');

      // Sign up
      const testEmail = generateRandomEmail();
      await tapElement('tab-profile');
      await tapElement('sign-in-button');
      await tapElement('create-account-link');

      await typeText('email-input', testEmail);
      await typeText('password-input', 'TestPassword123!');
      await typeText('confirm-password-input', 'TestPassword123!');
      
      await tapElement('sign-up-button');

      // Skip confirmation for this test
      await device.reloadReactNative();
      
      // Mock successful sign up
      await signIn(testEmail, 'TestPassword123!');

      // Check votes were preserved
      await waitFor(element(by.text(/2 votes/)))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await signIn(global.testUser.email, global.testUser.password);
    });

    it('should maintain session across app restarts', async () => {
      // Verify signed in
      await expect(element(by.text(global.testUser.email))).toBeVisible();

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Should still be signed in
      await tapElement('tab-profile');
      await waitForElement('profile-screen');
      await expect(element(by.text(global.testUser.email))).toBeVisible();
    });

    it('should handle session expiry', async () => {
      // Simulate expired token by blocking API calls
      await device.setURLBlacklist(['.*api.*']);

      // Try to perform authenticated action
      await tapElement('tab-voting');
      await submitVote('left');

      // Should redirect to sign in
      await waitForElement('session-expired-modal');
      await tapElement('sign-in-again-button');

      await waitForElement('sign-in-screen');

      // Cleanup
      await device.clearURLBlacklist();
    });

    it('should sign out from all devices', async () => {
      await scrollToElement('sign-out-button', 'profile-scroll-view');
      await tapElement('sign-out-button');

      // Choose sign out from all devices
      await tapElement('sign-out-all-devices');
      await tapElement('confirm-sign-out');

      // Should be signed out
      await waitForElement('sign-in-button');

      // Try to sign in from another session (simulated)
      // Should require re-authentication
      await device.reloadReactNative();
      await tapElement('tab-profile');
      await waitForElement('sign-in-button');
    });
  });

  describe('Biometric Authentication', () => {
    it('should prompt for biometric setup after sign in', async () => {
      await signIn(global.testUser.email, global.testUser.password);

      // Should show biometric prompt
      await waitForElement('biometric-setup-modal');
      
      // Enable biometric
      await tapElement('enable-biometric-button');

      // Mock biometric enrollment
      await waitForElement('biometric-success');
    });

    it('should sign in with biometrics', async () => {
      // Assume biometric is already set up
      await tapElement('sign-in-button');

      // Should show biometric option
      await waitForElement('biometric-sign-in-button');
      await tapElement('biometric-sign-in-button');

      // Mock successful biometric auth
      await waitForElement('profile-screen', 10000);
    });
  });
});