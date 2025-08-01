import { votingService } from '../votingService'
import { offlineManager } from '@/services/offline/offlineManager'
import { authService } from '@/services/auth/authService'

// Mock dependencies
jest.mock('@/services/auth/authService')
jest.mock('@/services/offline/offlineManager')
jest.mock('@/store/voting.store', () => ({
  useVotingStore: {
    getState: jest.fn(() => ({
      setPreferences: jest.fn(),
      incrementTotalVotes: jest.fn(),
      incrementStreak: jest.fn(),
      resetStreak: jest.fn(),
    })),
  },
}))

describe('VotingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    process.env.API_ENDPOINT = 'https://api.test.com'
    
    // Mock auth headers
    ;(authService.getAuthToken as jest.Mock).mockResolvedValue('test-token')
    ;(authService.getCurrentAuthState as jest.Mock).mockReturnValue({
      userId: 'test-user',
      isAnonymous: false,
    })
  })

  describe('getImagePair', () => {
    it('should fetch and return image pair successfully', async () => {
      const mockPair = {
        sessionId: 'session-123',
        images: [
          {
            imageId: '1',
            url: 'https://example.com/1.jpg',
            thumbnailUrl: 'https://example.com/1-thumb.jpg',
            characterName: 'Character 1',
            categories: ['category1'],
          },
          {
            imageId: '2',
            url: 'https://example.com/2.jpg',
            thumbnailUrl: 'https://example.com/2-thumb.jpg',
            characterName: 'Character 2',
            categories: ['category2'],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPair,
      })

      const result = await votingService.getImagePair()

      expect(result).toEqual(mockPair)
      expect(offlineManager.cacheImages).toHaveBeenCalledWith(mockPair.images)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/images/pair',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('should handle 404 error with specific message', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(votingService.getImagePair()).rejects.toThrow(
        'No more images available in this category'
      )
    })

    it('should handle authentication error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await expect(votingService.getImagePair()).rejects.toThrow(
        'Authentication required'
      )
    })
  })

  describe('submitVote', () => {
    const mockVote = {
      winnerId: 'winner-123',
      loserId: 'loser-456',
      category: 'test-category',
      sessionId: 'session-789',
    }

    it('should submit vote successfully when online', async () => {
      ;(offlineManager.getOnlineStatus as jest.Mock).mockReturnValue(true)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          voteId: 'vote-123',
          message: 'Vote submitted',
        }),
      })

      const result = await votingService.submitVote(mockVote)

      expect(result).toEqual({
        success: true,
        voteId: 'vote-123',
        message: 'Vote submitted',
      })
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/vote',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockVote),
        })
      )
    })

    it('should save vote offline when device is offline', async () => {
      ;(offlineManager.getOnlineStatus as jest.Mock).mockReturnValue(false)
      ;(offlineManager.saveVoteOffline as jest.Mock).mockResolvedValue(undefined)

      const result = await votingService.submitVote(mockVote)

      expect(result.success).toBe(true)
      expect(result.message).toContain('offline')
      expect(offlineManager.saveVoteOffline).toHaveBeenCalledWith(mockVote)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle duplicate vote error', async () => {
      ;(offlineManager.getOnlineStatus as jest.Mock).mockReturnValue(true)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
      })

      await expect(votingService.submitVote(mockVote)).rejects.toThrow(
        'You have already voted on this pair'
      )
    })

    it('should save offline on network error', async () => {
      ;(offlineManager.getOnlineStatus as jest.Mock).mockReturnValue(true)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      )
      ;(offlineManager.saveVoteOffline as jest.Mock).mockResolvedValue(undefined)

      const result = await votingService.submitVote(mockVote)

      expect(result.success).toBe(true)
      expect(result.message).toContain('offline')
      expect(offlineManager.saveVoteOffline).toHaveBeenCalledWith(mockVote)
    })
  })

  describe('hasVotedOnPair', () => {
    it('should correctly identify voted pairs', () => {
      // Clear and test initial state
      votingService.clearCache()
      expect(votingService.hasVotedOnPair('id1', 'id2')).toBe(false)

      // Submit a vote to add pair to voted list
      ;(offlineManager.getOnlineStatus as jest.Mock).mockReturnValue(true)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      votingService.submitVote({
        winnerId: 'id1',
        loserId: 'id2',
        category: 'test',
        sessionId: 'session',
      })

      // Should now return true for this pair
      expect(votingService.hasVotedOnPair('id1', 'id2')).toBe(true)
      expect(votingService.hasVotedOnPair('id2', 'id1')).toBe(true)
    })
  })

  describe('getUserStats', () => {
    it('should fetch and return user stats', async () => {
      const mockStats = {
        preferences: { primaryPreference: 'test' },
        stats: {
          totalVotes: 100,
          currentStreak: 5,
          lastVoteDate: new Date().toISOString(),
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      })

      const result = await votingService.getUserStats()

      expect(result).toEqual(mockStats)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/user/stats',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })
  })
})