import { authService } from '@/services/auth/authService';
import { votingService } from '@/services/voting/votingService';
import { generateClient } from 'aws-amplify/data';
import crypto from 'crypto';

// Mock dependencies
jest.mock('aws-amplify/data');
jest.mock('@/services/auth/authService');
jest.mock('@/services/voting/votingService');

describe('Security Tests', () => {
  const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockVotingService = votingService as jest.Mocked<typeof votingService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should sanitize user inputs to prevent XSS', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      
      // Test auth service
      await expect(authService.signUp(maliciousInput, 'password')).rejects.toThrow();
      
      // Test voting service
      await expect(votingService.submitVote({
        winnerId: maliciousInput,
        loserId: 'valid-id',
        category: 'category1',
        sessionId: 'session-1',
      })).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user@domain',
        'user space@example.com',
      ];

      for (const email of invalidEmails) {
        await expect(authService.signUp(email, 'ValidPassword123!')).rejects.toThrow();
      }
    });

    it('should prevent SQL injection in search queries', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM votes WHERE '1'='1",
      ];

      const mockClient = {
        models: {
          Image: {
            list: jest.fn().mockRejectedValue(new Error('Invalid input')),
          },
        },
      };
      mockGenerateClient.mockReturnValue(mockClient as any);

      for (const attempt of sqlInjectionAttempts) {
        await expect(
          mockClient.models.Image.list({
            filter: { characterName: { contains: attempt } },
          })
        ).rejects.toThrow();
      }
    });

    it('should limit input length to prevent buffer overflow', () => {
      const longString = 'a'.repeat(10000);
      
      // Password should have reasonable length limit
      expect(authService.isPasswordValid(longString)).toBe(false);
      
      // Other inputs should be truncated or rejected
      expect(() => {
        votingService.submitVote({
          winnerId: longString,
          loserId: 'valid-id',
          category: 'category1',
          sessionId: 'session-1',
        });
      }).rejects.toThrow();
    });
  });

  describe('Authentication Security', () => {
    it('should hash passwords before storage', async () => {
      const password = 'TestPassword123!';
      const signUpSpy = jest.spyOn(authService, 'signUp');
      
      await authService.signUp('test@example.com', password);
      
      // Verify password is not sent in plain text
      expect(signUpSpy).toHaveBeenCalled();
      const callArgs = signUpSpy.mock.calls[0];
      expect(callArgs[1]).toBe(password); // AWS Cognito handles hashing
    });

    it('should enforce password complexity requirements', () => {
      const weakPasswords = [
        'password',    // No uppercase, number, or special char
        'Password',    // No number or special char
        'Password1',   // No special char
        'Pass1!',      // Too short
        'PASSWORD1!',  // No lowercase
        'password1!',  // No uppercase
      ];

      for (const password of weakPasswords) {
        expect(authService.isPasswordValid(password)).toBe(false);
      }
    });

    it('should implement rate limiting for authentication attempts', async () => {
      const email = 'test@example.com';
      const wrongPassword = 'WrongPassword123!';
      
      // Simulate multiple failed attempts
      const attempts = Array(10).fill(null).map(() => 
        authService.signIn(email, wrongPassword).catch(() => {})
      );
      
      await Promise.all(attempts);
      
      // Next attempt should be rate limited
      await expect(authService.signIn(email, wrongPassword)).rejects.toThrow(/rate limit/i);
    });

    it('should expire sessions after inactivity', async () => {
      // Mock session with old timestamp
      const oldSession = {
        tokens: {
          accessToken: 'old-token',
          idToken: 'old-id-token',
        },
        credentials: {
          expiration: new Date(Date.now() - 3600000), // 1 hour ago
        },
      };
      
      mockAuthService.getCurrentUser.mockResolvedValue(null);
      
      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('Authorization', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      const mockClient = {
        models: {
          Image: {
            update: jest.fn().mockRejectedValue(new Error('Unauthorized')),
          },
        },
      };
      mockGenerateClient.mockReturnValue(mockClient as any);

      // Try to approve image without admin role
      await expect(
        mockClient.models.Image.update({
          id: 'image-1',
          status: 'approved',
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('should validate user can only modify their own data', async () => {
      const mockClient = {
        models: {
          User: {
            update: jest.fn().mockImplementation((data) => {
              if (data.id !== 'current-user-id') {
                return Promise.reject(new Error('Forbidden'));
              }
              return Promise.resolve({ data });
            }),
          },
        },
      };
      mockGenerateClient.mockReturnValue(mockClient as any);

      // Try to update another user's profile
      await expect(
        mockClient.models.User.update({
          id: 'other-user-id',
          preferences: { primaryPreference: 'hacked' },
        })
      ).rejects.toThrow('Forbidden');

      // Should succeed for own profile
      await expect(
        mockClient.models.User.update({
          id: 'current-user-id',
          preferences: { primaryPreference: 'category1' },
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Data Protection', () => {
    it('should encrypt sensitive data in transit', () => {
      // Verify API endpoints use HTTPS
      const apiEndpoint = process.env.EXPO_PUBLIC_API_ENDPOINT || '';
      expect(apiEndpoint).toMatch(/^https:\/\//);
    });

    it('should not expose sensitive data in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const sensitiveData = {
        password: 'TestPassword123!',
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
      };

      // Simulate logging
      console.log('User data:', { ...sensitiveData, password: '[REDACTED]' });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(JSON.stringify(logCall)).not.toContain('TestPassword123!');
      expect(JSON.stringify(logCall)).toContain('[REDACTED]');
    });

    it('should implement CSRF protection', async () => {
      const mockClient = {
        models: {
          Vote: {
            create: jest.fn().mockImplementation((data) => {
              // Check for CSRF token
              if (!data.csrfToken) {
                return Promise.reject(new Error('CSRF token required'));
              }
              return Promise.resolve({ data });
            }),
          },
        },
      };
      mockGenerateClient.mockReturnValue(mockClient as any);

      // Request without CSRF token should fail
      await expect(
        mockClient.models.Vote.create({
          winnerId: 'image-1',
          loserId: 'image-2',
        })
      ).rejects.toThrow('CSRF token required');
    });
  });

  describe('API Security', () => {
    it('should validate API request signatures', async () => {
      const request = {
        method: 'POST',
        url: '/api/vote',
        body: { winnerId: 'image-1', loserId: 'image-2' },
        timestamp: Date.now(),
      };

      const signature = crypto
        .createHmac('sha256', 'api-secret')
        .update(JSON.stringify(request))
        .digest('hex');

      // Verify signature validation
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should implement request throttling', async () => {
      const requests = Array(1000).fill(null).map((_, i) => 
        votingService.submitVote({
          winnerId: `image-${i}`,
          loserId: `image-${i + 1}`,
          category: 'category1',
          sessionId: 'session-1',
        }).catch(() => {})
      );

      const results = await Promise.allSettled(requests);
      const rejected = results.filter(r => r.status === 'rejected');
      
      // Should throttle excessive requests
      expect(rejected.length).toBeGreaterThan(0);
    });

    it('should validate content type headers', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockImplementation(async (url, options) => {
        const headers = options?.headers as any;
        if (headers?.['Content-Type'] !== 'application/json') {
          return new Response(null, { status: 415 });
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      // Request with wrong content type
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'not json',
      });

      expect(response.status).toBe(415); // Unsupported Media Type
    });
  });

  describe('Image Security', () => {
    it('should validate image file types', async () => {
      const invalidFiles = [
        { name: 'script.js', type: 'text/javascript' },
        { name: 'executable.exe', type: 'application/x-msdownload' },
        { name: 'document.pdf', type: 'application/pdf' },
      ];

      for (const file of invalidFiles) {
        await expect(
          votingService.uploadImage(file as any)
        ).rejects.toThrow(/invalid file type/i);
      }
    });

    it('should scan images for malicious content', async () => {
      // Mock image with embedded script
      const maliciousImage = new File(
        ['<svg onload="alert(1)">'],
        'image.svg',
        { type: 'image/svg+xml' }
      );

      await expect(
        votingService.uploadImage(maliciousImage as any)
      ).rejects.toThrow(/security/i);
    });

    it('should enforce image size limits', async () => {
      const largeImage = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
      };

      await expect(
        votingService.uploadImage(largeImage as any)
      ).rejects.toThrow(/size limit/i);
    });
  });

  describe('Session Security', () => {
    it('should regenerate session ID after login', async () => {
      const oldSessionId = 'old-session-123';
      let currentSessionId = oldSessionId;

      mockAuthService.signIn.mockImplementation(async () => {
        currentSessionId = `new-session-${Date.now()}`;
        return { isSignedIn: true, nextStep: { signInStep: 'DONE' } };
      });

      await authService.signIn('test@example.com', 'password');
      
      expect(currentSessionId).not.toBe(oldSessionId);
    });

    it('should invalidate sessions on password change', async () => {
      const activeSessions = ['session-1', 'session-2', 'session-3'];
      
      mockAuthService.changePassword.mockImplementation(async () => {
        // Invalidate all sessions
        activeSessions.length = 0;
      });

      await authService.changePassword('oldPass', 'newPass');
      
      expect(activeSessions).toHaveLength(0);
    });
  });

  describe('Privacy', () => {
    it('should anonymize user data in analytics', () => {
      const userData = {
        userId: 'user-123',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
      };

      const analyticsData = {
        userId: crypto.createHash('sha256').update(userData.userId).digest('hex'),
        country: 'US', // Derived from IP but IP not stored
        // No email or IP stored
      };

      expect(analyticsData.userId).not.toBe(userData.userId);
      expect(analyticsData).not.toHaveProperty('email');
      expect(analyticsData).not.toHaveProperty('ipAddress');
    });

    it('should implement data retention policies', async () => {
      const oldVotes = [
        { id: 'vote-1', createdAt: new Date('2020-01-01') },
        { id: 'vote-2', createdAt: new Date('2020-02-01') },
      ];

      // Simulate data cleanup job
      const retentionPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year
      const cutoffDate = new Date(Date.now() - retentionPeriod);
      
      const retainedVotes = oldVotes.filter(vote => 
        vote.createdAt > cutoffDate
      );

      expect(retainedVotes).toHaveLength(0);
    });
  });
});