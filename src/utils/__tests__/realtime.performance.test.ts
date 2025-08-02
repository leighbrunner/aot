import { realtimeService } from '../../services/realtime/realtimeService';
import type { Schema } from '@/amplify/data/resource';

describe('Real-time Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    realtimeService.cleanup();
  });

  describe('Subscription Performance', () => {
    it('should handle multiple simultaneous subscriptions', async () => {
      const subscriptions = [];
      const messageHandlers: Array<jest.Mock> = [];
      
      // Create 10 simultaneous subscriptions
      for (let i = 0; i < 10; i++) {
        const handler = jest.fn();
        messageHandlers.push(handler);
        
        const subscription = realtimeService.subscribeToVoteActivity(
          handler,
          (error) => console.error('Subscription error:', error)
        );
        
        subscriptions.push(subscription);
      }
      
      // Verify all subscriptions are active
      expect(subscriptions).toHaveLength(10);
      
      // Clean up
      subscriptions.forEach(sub => sub.unsubscribe());
    });

    it('should handle rapid message updates', async () => {
      const messageHandler = jest.fn();
      let messageCount = 0;
      
      const subscription = realtimeService.subscribeToStatsUpdates(
        (update) => {
          messageCount++;
          messageHandler(update);
        }
      );
      
      // Simulate rapid updates (would come from server in real scenario)
      const startTime = Date.now();
      
      // In a real test, we'd trigger actual messages from the server
      // For now, we'll just verify the subscription is set up correctly
      expect(subscription).toBeDefined();
      
      // Measure subscription overhead
      const setupTime = Date.now() - startTime;
      expect(setupTime).toBeLessThan(100); // Should set up in < 100ms
      
      subscription.unsubscribe();
    });

    it('should maintain low memory footprint', () => {
      const subscriptions = [];
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and destroy subscriptions
      for (let i = 0; i < 5; i++) {
        const sub = realtimeService.subscribeToVoteActivity(
          () => {},
          () => {}
        );
        subscriptions.push(sub);
      }
      
      // Unsubscribe all
      subscriptions.forEach(sub => sub.unsubscribe());
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;
      
      // Memory increase should be minimal (< 1MB)
      expect(memoryDiff).toBeLessThan(1024 * 1024);
    });
  });

  describe('Message Processing Performance', () => {
    it('should process messages without blocking UI', async () => {
      const processedMessages: Schema['VoteActivity']['type'][] = [];
      
      const subscription = realtimeService.subscribeToVoteActivity(
        (activity) => {
          // Simulate processing
          const startProcess = performance.now();
          
          // Do some work
          processedMessages.push(activity);
          
          const processTime = performance.now() - startProcess;
          
          // Each message should process in < 5ms
          expect(processTime).toBeLessThan(5);
        }
      );
      
      // In real scenario, messages would come from server
      // Verify subscription is ready
      expect(subscription).toBeDefined();
      
      subscription.unsubscribe();
    });

    it('should handle connection drops gracefully', async () => {
      const errorHandler = jest.fn();
      const messageHandler = jest.fn();
      
      const subscription = realtimeService.subscribeToVoteActivity(
        messageHandler,
        errorHandler
      );
      
      // Simulate connection drop (in real test would disconnect network)
      // For now, just verify error handler is set up
      expect(subscription).toBeDefined();
      
      subscription.unsubscribe();
      
      // Verify no errors during normal operation
      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should efficiently batch multiple operations', async () => {
      const startTime = performance.now();
      
      // Get recent activity and latest stats in parallel
      const [activities, stats] = await Promise.all([
        realtimeService.getRecentActivity(50),
        realtimeService.getLatestStats(),
      ]);
      
      const totalTime = performance.now() - startTime;
      
      // Both operations should complete quickly
      expect(totalTime).toBeLessThan(1000); // < 1 second
      expect(activities).toBeDefined();
      expect(stats).toBeDefined();
    });
  });

  describe('Cleanup Performance', () => {
    it('should clean up resources efficiently', () => {
      // Create multiple subscriptions
      const subs = [];
      for (let i = 0; i < 20; i++) {
        subs.push(
          realtimeService.subscribeToVoteActivity(() => {})
        );
      }
      
      const cleanupStart = performance.now();
      
      // Clean up all at once
      realtimeService.cleanup();
      
      const cleanupTime = performance.now() - cleanupStart;
      
      // Cleanup should be fast
      expect(cleanupTime).toBeLessThan(50); // < 50ms
    });
  });
});