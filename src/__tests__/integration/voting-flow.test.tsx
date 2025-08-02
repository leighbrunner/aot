import React from 'react';
import { render, fireEvent, waitFor, act } from '@/test/utils/test-utils';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VotingScreen from '@/screens/VotingScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { votingService } from '@/services/voting/votingService';
import { authService } from '@/services/auth/authService';
import { generateClient } from 'aws-amplify/data';

// Mock dependencies
jest.mock('@/services/voting/votingService');
jest.mock('@/services/auth/authService');
jest.mock('aws-amplify/data');

const Stack = createNativeStackNavigator();

const TestApp = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Voting" component={VotingScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('Voting Flow Integration', () => {
  const mockVotingService = votingService as jest.Mocked<typeof votingService>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

  const mockClient = {
    models: {
      Image: {
        list: jest.fn(),
        observeQuery: jest.fn(() => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        })),
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateClient.mockReturnValue(mockClient as any);
    
    // Setup default mocks
    mockAuthService.getCurrentUser.mockResolvedValue({
      username: 'test@example.com',
      userId: 'user-123',
    });
    
    mockVotingService.getRandomImagePairs.mockResolvedValue([
      {
        id: 'image-1',
        url: 'https://example.com/image1.jpg',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        characterName: 'Character 1',
        categories: ['category1'],
        metadata: { ageRange: '18-25', nationality: 'US' },
        voteCount: 100,
        winCount: 60,
        rating: 0.6,
      },
      {
        id: 'image-2',
        url: 'https://example.com/image2.jpg',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        characterName: 'Character 2',
        categories: ['category1'],
        metadata: { ageRange: '26-35', nationality: 'UK' },
        voteCount: 80,
        winCount: 40,
        rating: 0.5,
      },
    ]);
    
    mockVotingService.submitVote.mockResolvedValue({ voteId: 'vote-123' });
    
    mockClient.models.User.get.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        stats: {
          totalVotes: 100,
          currentStreak: 5,
          longestStreak: 10,
        },
      },
    });
    
    mockClient.models.Vote.list.mockResolvedValue({
      data: [
        {
          voteId: 'vote-1',
          winnerId: 'image-1',
          loserId: 'image-2',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });

  it('completes full voting flow', async () => {
    const { getByTestId, getByText } = render(<TestApp />);

    // Wait for images to load
    await waitFor(() => {
      expect(getByText('Character 1')).toBeTruthy();
      expect(getByText('Character 2')).toBeTruthy();
    });

    // Submit a vote
    const leftVoteButton = getByTestId('vote-button-left');
    fireEvent.press(leftVoteButton);

    // Verify vote was submitted
    await waitFor(() => {
      expect(mockVotingService.submitVote).toHaveBeenCalledWith({
        winnerId: 'image-1',
        loserId: 'image-2',
        category: 'category1',
        sessionId: expect.any(String),
      });
    });

    // Navigate to leaderboard
    const leaderboardTab = getByTestId('tab-leaderboard');
    fireEvent.press(leaderboardTab);

    // Wait for leaderboard to load
    await waitFor(() => {
      expect(getByText('Top Rated')).toBeTruthy();
    });

    // Navigate to profile
    const profileTab = getByTestId('tab-profile');
    fireEvent.press(profileTab);

    // Wait for profile to load
    await waitFor(() => {
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('100 votes')).toBeTruthy();
      expect(getByText('5 day streak')).toBeTruthy();
    });
  });

  it('handles offline voting', async () => {
    // Simulate offline
    mockVotingService.submitVote.mockRejectedValue(new Error('Network error'));
    
    const { getByTestId, getByText } = render(<TestApp />);

    await waitFor(() => {
      expect(getByText('Character 1')).toBeTruthy();
    });

    // Try to vote while offline
    const leftVoteButton = getByTestId('vote-button-left');
    fireEvent.press(leftVoteButton);

    // Should show offline message
    await waitFor(() => {
      expect(getByText(/offline/i)).toBeTruthy();
    });

    // Simulate coming back online
    mockVotingService.submitVote.mockResolvedValue({ voteId: 'vote-123' });
    
    // Retry vote
    fireEvent.press(leftVoteButton);

    await waitFor(() => {
      expect(mockVotingService.submitVote).toHaveBeenCalledTimes(2);
    });
  });

  it('maintains voting streak across sessions', async () => {
    const { getByTestId, getByText } = render(<TestApp />);

    // Wait for initial load
    await waitFor(() => {
      expect(getByText('Character 1')).toBeTruthy();
    });

    // Submit multiple votes
    const leftVoteButton = getByTestId('vote-button-left');
    
    for (let i = 0; i < 3; i++) {
      fireEvent.press(leftVoteButton);
      
      await waitFor(() => {
        expect(mockVotingService.submitVote).toHaveBeenCalledTimes(i + 1);
      });

      // Load next pair
      mockVotingService.getRandomImagePairs.mockResolvedValue([
        {
          id: `image-${i * 2 + 3}`,
          url: `https://example.com/image${i * 2 + 3}.jpg`,
          thumbnailUrl: `https://example.com/thumb${i * 2 + 3}.jpg`,
          characterName: `Character ${i * 2 + 3}`,
          categories: ['category1'],
          metadata: { ageRange: '18-25', nationality: 'US' },
          voteCount: 50,
          winCount: 25,
          rating: 0.5,
        },
        {
          id: `image-${i * 2 + 4}`,
          url: `https://example.com/image${i * 2 + 4}.jpg`,
          thumbnailUrl: `https://example.com/thumb${i * 2 + 4}.jpg`,
          characterName: `Character ${i * 2 + 4}`,
          categories: ['category1'],
          metadata: { ageRange: '26-35', nationality: 'UK' },
          voteCount: 50,
          winCount: 25,
          rating: 0.5,
        },
      ]);
    }

    // Check profile for updated streak
    const profileTab = getByTestId('tab-profile');
    fireEvent.press(profileTab);

    await waitFor(() => {
      expect(getByText(/streak/i)).toBeTruthy();
    });
  });

  it('updates leaderboard after voting', async () => {
    const { getByTestId, getByText } = render(<TestApp />);

    // Initial leaderboard state
    mockClient.models.Image.list.mockResolvedValue({
      data: [
        {
          id: 'image-1',
          characterName: 'Character 1',
          voteCount: 100,
          winCount: 60,
          rating: 0.6,
        },
      ],
    });

    // Vote on images
    await waitFor(() => {
      expect(getByText('Character 1')).toBeTruthy();
    });

    const leftVoteButton = getByTestId('vote-button-left');
    fireEvent.press(leftVoteButton);

    await waitFor(() => {
      expect(mockVotingService.submitVote).toHaveBeenCalled();
    });

    // Update mock to reflect new vote
    mockClient.models.Image.list.mockResolvedValue({
      data: [
        {
          id: 'image-1',
          characterName: 'Character 1',
          voteCount: 101,
          winCount: 61,
          rating: 0.604,
        },
      ],
    });

    // Navigate to leaderboard
    const leaderboardTab = getByTestId('tab-leaderboard');
    fireEvent.press(leaderboardTab);

    // Check updated stats
    await waitFor(() => {
      expect(getByText('101 votes')).toBeTruthy();
      expect(getByText('60.4%')).toBeTruthy();
    });
  });

  it('handles category filtering', async () => {
    // Setup multiple categories
    mockVotingService.getRandomImagePairs.mockResolvedValue([
      {
        id: 'image-1',
        url: 'https://example.com/image1.jpg',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        characterName: 'Character 1',
        categories: ['category1', 'category2'],
        metadata: { ageRange: '18-25', nationality: 'US' },
        voteCount: 100,
        winCount: 60,
        rating: 0.6,
      },
      {
        id: 'image-2',
        url: 'https://example.com/image2.jpg',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        characterName: 'Character 2',
        categories: ['category1'],
        metadata: { ageRange: '26-35', nationality: 'UK' },
        voteCount: 80,
        winCount: 40,
        rating: 0.5,
      },
    ]);

    const { getByTestId, getByText } = render(<TestApp />);

    await waitFor(() => {
      expect(getByText('Character 1')).toBeTruthy();
    });

    // Open category filter
    const filterButton = getByTestId('category-filter-button');
    fireEvent.press(filterButton);

    // Select category2
    await waitFor(() => {
      expect(getByText('category2')).toBeTruthy();
    });
    
    fireEvent.press(getByText('category2'));

    // Verify service was called with category filter
    await waitFor(() => {
      expect(mockVotingService.getRandomImagePairs).toHaveBeenCalledWith('category2', expect.any(Number));
    });
  });

  it('handles authentication state changes', async () => {
    // Start as anonymous
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    
    const { getByTestId, getByText, rerender } = render(<TestApp />);

    // Should show anonymous UI
    await waitFor(() => {
      expect(getByText(/sign in/i)).toBeTruthy();
    });

    // Simulate sign in
    act(() => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        username: 'test@example.com',
        userId: 'user-123',
      });
    });

    // Rerender to trigger auth state update
    rerender(<TestApp />);

    // Navigate to profile
    const profileTab = getByTestId('tab-profile');
    fireEvent.press(profileTab);

    // Should show authenticated UI
    await waitFor(() => {
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });
});