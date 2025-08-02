import React from 'react';
import { render, fireEvent, waitFor } from '@/test/utils/test-utils';
import VotingCard from '../VotingCard';
import { useVotingStore } from '@/store/voting.store';

// Mock the store
jest.mock('@/store/voting.store');

describe('VotingCard', () => {
  const mockUseVotingStore = useVotingStore as jest.MockedFunction<typeof useVotingStore>;
  
  const mockImages = [
    {
      id: 'image-1',
      url: 'https://example.com/image1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      characterName: 'Character 1',
      metadata: {
        ageRange: '18-25',
        nationality: 'US',
      },
    },
    {
      id: 'image-2',
      url: 'https://example.com/image2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      characterName: 'Character 2',
      metadata: {
        ageRange: '26-35',
        nationality: 'UK',
      },
    },
  ];

  const mockStore = {
    submitVote: jest.fn().mockResolvedValue(undefined),
    imagePairs: [mockImages],
    currentPairIndex: 0,
    loadNextPair: jest.fn(),
    preloadImages: jest.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVotingStore.mockReturnValue(mockStore);
  });

  it('renders correctly with two images', () => {
    const { getByText, getAllByTestId } = render(
      <VotingCard images={mockImages} />
    );

    expect(getByText('Character 1')).toBeTruthy();
    expect(getByText('Character 2')).toBeTruthy();
    expect(getByText('18-25, US')).toBeTruthy();
    expect(getByText('26-35, UK')).toBeTruthy();
    
    const images = getAllByTestId('voting-image');
    expect(images).toHaveLength(2);
  });

  it('handles vote submission when left image is clicked', async () => {
    const { getByTestId } = render(
      <VotingCard images={mockImages} />
    );

    const leftButton = getByTestId('vote-button-left');
    fireEvent.press(leftButton);

    await waitFor(() => {
      expect(mockStore.submitVote).toHaveBeenCalledWith(
        'image-1',
        'image-2',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it('handles vote submission when right image is clicked', async () => {
    const { getByTestId } = render(
      <VotingCard images={mockImages} />
    );

    const rightButton = getByTestId('vote-button-right');
    fireEvent.press(rightButton);

    await waitFor(() => {
      expect(mockStore.submitVote).toHaveBeenCalledWith(
        'image-2',
        'image-1',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it('disables voting buttons while submitting', async () => {
    mockStore.submitVote.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByTestId } = render(
      <VotingCard images={mockImages} />
    );

    const leftButton = getByTestId('vote-button-left');
    fireEvent.press(leftButton);

    // Button should be disabled during submission
    expect(leftButton.props.accessibilityState.disabled).toBe(true);

    await waitFor(() => {
      expect(mockStore.submitVote).toHaveBeenCalled();
    });
  });

  it('preloads next images after vote', async () => {
    const { getByTestId } = render(
      <VotingCard images={mockImages} />
    );

    const leftButton = getByTestId('vote-button-left');
    fireEvent.press(leftButton);

    await waitFor(() => {
      expect(mockStore.loadNextPair).toHaveBeenCalled();
      expect(mockStore.preloadImages).toHaveBeenCalled();
    });
  });

  it('displays loading overlay when loading', () => {
    mockUseVotingStore.mockReturnValue({
      ...mockStore,
      loading: true,
    });

    const { getByTestId } = render(
      <VotingCard images={mockImages} />
    );

    expect(getByTestId('loading-overlay')).toBeTruthy();
  });

  it('handles gesture-based voting on mobile', async () => {
    const { getByTestId } = render(
      <VotingCard images={mockImages} />
    );

    const leftCard = getByTestId('voting-card-left');
    
    // Simulate swipe up gesture
    fireEvent(leftCard, 'onGestureEvent', {
      nativeEvent: {
        translationY: -150,
        velocityY: -500,
      },
    });

    await waitFor(() => {
      expect(mockStore.submitVote).toHaveBeenCalledWith(
        'image-1',
        'image-2',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it('shows metadata correctly', () => {
    const { getByText } = render(
      <VotingCard images={mockImages} />
    );

    expect(getByText('18-25, US')).toBeTruthy();
    expect(getByText('26-35, UK')).toBeTruthy();
  });

  it('handles missing metadata gracefully', () => {
    const imagesWithoutMetadata = [
      {
        ...mockImages[0],
        metadata: {},
      },
      {
        ...mockImages[1],
        metadata: {},
      },
    ];

    const { queryByText } = render(
      <VotingCard images={imagesWithoutMetadata} />
    );

    // Should still render without crashing
    expect(queryByText('Character 1')).toBeTruthy();
    expect(queryByText('Character 2')).toBeTruthy();
  });
});