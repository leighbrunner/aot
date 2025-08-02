import { act, renderHook } from '@testing-library/react-native';
import { useVotingStore } from '../voting.store';
import { votingService } from '@/services/voting/votingService';
import { offlineManager } from '@/utils/offline/offlineManager';

// Mock dependencies
jest.mock('@/services/voting/votingService');
jest.mock('@/utils/offline/offlineManager');

describe('VotingStore', () => {
  const mockVotingService = votingService as jest.Mocked<typeof votingService>;
  const mockOfflineManager = offlineManager as jest.Mocked<typeof offlineManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineManager.isOnline.mockReturnValue(true);
    
    // Reset store state
    const { result } = renderHook(() => useVotingStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('loadImagePairs', () => {
    it('successfully loads image pairs', async () => {
      const mockImages = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
        { id: '3', url: 'url3' },
        { id: '4', url: 'url4' },
      ];
      
      mockVotingService.getRandomImagePairs.mockResolvedValue(mockImages);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.loadImagePairs();
      });

      expect(result.current.imagePairs).toHaveLength(2);
      expect(result.current.imagePairs[0]).toHaveLength(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles loading error', async () => {
      const error = new Error('Failed to load images');
      mockVotingService.getRandomImagePairs.mockRejectedValue(error);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.loadImagePairs();
      });

      expect(result.current.imagePairs).toHaveLength(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load images');
    });

    it('respects category filter', async () => {
      const mockImages = [
        { id: '1', url: 'url1', categories: ['category1'] },
        { id: '2', url: 'url2', categories: ['category1'] },
      ];
      
      mockVotingService.getRandomImagePairs.mockResolvedValue(mockImages);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.loadImagePairs('category1');
      });

      expect(mockVotingService.getRandomImagePairs).toHaveBeenCalledWith('category1', 4);
    });
  });

  describe('submitVote', () => {
    it('successfully submits a vote', async () => {
      mockVotingService.submitVote.mockResolvedValue({ voteId: 'vote-123' });

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.submitVote('winner-1', 'loser-1', 'category1', 'session-1');
      });

      expect(mockVotingService.submitVote).toHaveBeenCalledWith({
        winnerId: 'winner-1',
        loserId: 'loser-1',
        category: 'category1',
        sessionId: 'session-1',
      });
      
      expect(result.current.votes).toHaveLength(1);
      expect(result.current.votes[0]).toMatchObject({
        winnerId: 'winner-1',
        loserId: 'loser-1',
        category: 'category1',
      });
    });

    it('queues vote when offline', async () => {
      mockOfflineManager.isOnline.mockReturnValue(false);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.submitVote('winner-1', 'loser-1', 'category1', 'session-1');
      });

      expect(mockOfflineManager.queueOperation).toHaveBeenCalledWith(
        'vote',
        {
          winnerId: 'winner-1',
          loserId: 'loser-1',
          category: 'category1',
          sessionId: 'session-1',
        }
      );
      
      expect(mockVotingService.submitVote).not.toHaveBeenCalled();
    });

    it('handles vote submission error', async () => {
      const error = new Error('Vote failed');
      mockVotingService.submitVote.mockRejectedValue(error);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.submitVote('winner-1', 'loser-1', 'category1', 'session-1');
      });

      expect(result.current.error).toBe('Vote failed');
    });
  });

  describe('streak management', () => {
    it('increments streak on consecutive votes', async () => {
      mockVotingService.submitVote.mockResolvedValue({ voteId: 'vote-123' });

      const { result } = renderHook(() => useVotingStore());

      // First vote
      await act(async () => {
        await result.current.submitVote('winner-1', 'loser-1', 'category1', 'session-1');
      });

      expect(result.current.currentStreak).toBe(1);

      // Second vote
      await act(async () => {
        await result.current.submitVote('winner-2', 'loser-2', 'category1', 'session-1');
      });

      expect(result.current.currentStreak).toBe(2);
      expect(result.current.longestStreak).toBe(2);
    });

    it('resets streak after inactivity', async () => {
      mockVotingService.submitVote.mockResolvedValue({ voteId: 'vote-123' });

      const { result } = renderHook(() => useVotingStore());

      // Set last vote date to yesterday
      act(() => {
        result.current.lastVoteDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
        result.current.currentStreak = 5;
      });

      // Vote today - should reset streak
      await act(async () => {
        await result.current.submitVote('winner-1', 'loser-1', 'category1', 'session-1');
      });

      expect(result.current.currentStreak).toBe(1);
    });
  });

  describe('navigation', () => {
    it('navigates to next pair', async () => {
      const mockImages = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
        { id: '3', url: 'url3' },
        { id: '4', url: 'url4' },
      ];
      
      mockVotingService.getRandomImagePairs.mockResolvedValue(mockImages);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.loadImagePairs();
      });

      expect(result.current.currentPairIndex).toBe(0);

      act(() => {
        result.current.loadNextPair();
      });

      expect(result.current.currentPairIndex).toBe(1);
    });

    it('loads more pairs when reaching end', async () => {
      const mockImages = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
      ];
      
      mockVotingService.getRandomImagePairs.mockResolvedValue(mockImages);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.loadImagePairs();
      });

      act(() => {
        result.current.loadNextPair();
      });

      expect(mockVotingService.getRandomImagePairs).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloadImages', () => {
    it('preloads next images', async () => {
      const mockImages = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
        { id: '3', url: 'url3' },
        { id: '4', url: 'url4' },
      ];
      
      mockVotingService.getRandomImagePairs.mockResolvedValue(mockImages);

      const { result } = renderHook(() => useVotingStore());

      await act(async () => {
        await result.current.loadImagePairs();
      });

      await act(async () => {
        await result.current.preloadImages();
      });

      // Should attempt to preload next pair images
      expect(result.current.imagePairs).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('resets store to initial state', async () => {
      const mockImages = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
      ];
      
      mockVotingService.getRandomImagePairs.mockResolvedValue(mockImages);
      mockVotingService.submitVote.mockResolvedValue({ voteId: 'vote-123' });

      const { result } = renderHook(() => useVotingStore());

      // Load data and submit vote
      await act(async () => {
        await result.current.loadImagePairs();
        await result.current.submitVote('winner-1', 'loser-1', 'category1', 'session-1');
      });

      // Reset store
      act(() => {
        result.current.reset();
      });

      expect(result.current.imagePairs).toHaveLength(0);
      expect(result.current.votes).toHaveLength(0);
      expect(result.current.currentPairIndex).toBe(0);
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });
});