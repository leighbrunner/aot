import { by, element, expect, device, waitFor } from 'detox';

describe('Voting E2E Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Anonymous Voting', () => {
    it('should allow anonymous users to vote', async () => {
      // Wait for voting screen to load
      await waitForElement('voting-screen');
      await waitForElement('voting-card-left');
      await waitForElement('voting-card-right');

      // Submit a vote
      await submitVote('left');

      // Verify next pair loaded
      await waitForElement('voting-card-left');
      await waitForElement('voting-card-right');
    });

    it('should maintain voting streak', async () => {
      // Submit multiple votes
      for (let i = 0; i < 5; i++) {
        await submitVote(i % 2 === 0 ? 'left' : 'right');
      }

      // Check streak counter
      await expect(element(by.id('streak-counter'))).toHaveText('5');
    });

    it('should handle rapid voting', async () => {
      // Submit votes quickly
      await submitVote('left');
      await submitVote('right');
      await submitVote('left');

      // Should not crash and continue working
      await waitForElement('voting-card-left');
    });
  });

  describe('Authenticated Voting', () => {
    beforeEach(async () => {
      await signIn(global.testUser.email, global.testUser.password);
      await tapElement('tab-voting');
    });

    afterEach(async () => {
      await signOut();
    });

    it('should track votes for authenticated users', async () => {
      // Submit votes
      await submitVote('left');
      await submitVote('right');

      // Navigate to profile
      await tapElement('tab-profile');
      
      // Check vote count
      await waitFor(element(by.text(/\d+ votes/)))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should update preferences based on voting patterns', async () => {
      // Vote consistently for one category
      for (let i = 0; i < 10; i++) {
        await submitVote('left');
      }

      // Check profile for preference
      await tapElement('tab-profile');
      await scrollToElement('preference-section', 'profile-scroll-view');
      
      await expect(element(by.id('primary-preference'))).toBeVisible();
    });
  });

  describe('Swipe Gestures', () => {
    it('should vote with swipe up gesture', async () => {
      await waitForElement('voting-card-left');
      
      // Swipe up on left card
      await swipeElement('voting-card-left', 'up');
      
      // Should load next pair
      await waitForElement('voting-card-left');
    });

    it('should vote with swipe down gesture', async () => {
      await waitForElement('voting-card-right');
      
      // Swipe down on right card
      await swipeElement('voting-card-right', 'down');
      
      // Should show rejection animation and load next
      await waitForElement('voting-card-right');
    });

    it('should cancel vote with horizontal swipe', async () => {
      await waitForElement('voting-card-left');
      
      // Start vertical swipe
      await element(by.id('voting-card-left')).swipe('up', 'slow', 0.3);
      
      // Cancel with horizontal swipe
      await element(by.id('voting-card-left')).swipe('right');
      
      // Card should return to original position
      await expect(element(by.id('voting-card-left'))).toBeVisible();
    });
  });

  describe('Category Filtering', () => {
    it('should filter images by category', async () => {
      // Open category filter
      await tapElement('category-filter-button');
      await waitForElement('category-modal');

      // Select a specific category
      await tapElement('category-option-1');
      await tapElement('apply-filter-button');

      // Verify filter is applied
      await expect(element(by.id('active-filter-badge'))).toBeVisible();
      await expect(element(by.id('active-filter-badge'))).toHaveText('1');
    });

    it('should clear category filter', async () => {
      // Apply filter first
      await tapElement('category-filter-button');
      await tapElement('category-option-1');
      await tapElement('apply-filter-button');

      // Clear filter
      await tapElement('clear-filter-button');

      // Verify filter is removed
      await expect(element(by.id('active-filter-badge'))).not.toBeVisible();
    });
  });

  describe('Offline Support', () => {
    it('should queue votes when offline', async () => {
      // Go offline
      await device.setURLBlacklist(['.*']);

      // Try to vote
      await submitVote('left');

      // Should show offline indicator
      await waitForElement('offline-indicator');

      // Go back online
      await device.clearURLBlacklist();

      // Should sync votes
      await waitFor(element(by.id('offline-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);
    });

    it('should load cached images when offline', async () => {
      // Load images first
      await waitForElement('voting-card-left');

      // Go offline
      await device.setURLBlacklist(['.*']);

      // Navigate away and back
      await tapElement('tab-leaderboard');
      await tapElement('tab-voting');

      // Should still show cached images
      await waitForElement('voting-card-left');
      await waitForElement('voting-card-right');

      // Cleanup
      await device.clearURLBlacklist();
    });
  });

  describe('Performance', () => {
    it('should handle 100 rapid votes without crashing', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await submitVote(i % 2 === 0 ? 'left' : 'right');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 60 seconds)
      expect(duration).toBeLessThan(60000);

      // App should still be responsive
      await waitForElement('voting-card-left');
    });

    it('should preload next images while voting', async () => {
      // Enable network monitoring
      await device.setURLBlacklist([]);
      
      // Initial load
      await waitForElement('voting-card-left');

      // Vote and immediately check for next pair
      await submitVote('left');

      // Next pair should load quickly (< 500ms)
      await waitFor(element(by.id('voting-card-left')))
        .toBeVisible()
        .withTimeout(500);
    });
  });

  describe('Error Handling', () => {
    it('should show error when image fails to load', async () => {
      // Block image URLs
      await device.setURLBlacklist(['.*\\.jpg', '.*\\.png']);

      await device.reloadReactNative();

      // Should show error state
      await waitForElement('image-error-placeholder');

      // Should allow retry
      await tapElement('retry-button');

      // Cleanup
      await device.clearURLBlacklist();
    });

    it('should handle vote submission errors gracefully', async () => {
      // Block API calls
      await device.setURLBlacklist(['.*api.*']);

      // Try to vote
      await submitVote('left');

      // Should show error message
      await waitForElement('vote-error-message');

      // Should allow retry
      await tapElement('retry-vote-button');

      // Cleanup
      await device.clearURLBlacklist();
    });
  });

  describe('Accessibility', () => {
    it('should be navigable with screen reader', async () => {
      // This would require actual device testing with accessibility enabled
      // For now, verify accessibility labels exist
      
      await expect(element(by.id('voting-card-left'))).toHaveLabel('Vote for left image');
      await expect(element(by.id('voting-card-right'))).toHaveLabel('Vote for right image');
      await expect(element(by.id('tab-voting'))).toHaveLabel('Voting tab');
      await expect(element(by.id('tab-leaderboard'))).toHaveLabel('Leaderboard tab');
      await expect(element(by.id('tab-profile'))).toHaveLabel('Profile tab');
    });
  });
});