import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme, Snackbar, Button } from 'react-native-paper';
import { VotingCard } from '@/components/VotingCard';
import { votingService, ImagePair, VoteSubmission } from '@/services/api/votingService';
import { useAuth } from '@/contexts/AuthContext';
import { useVotingHistory } from '@/hooks/useVotingHistory';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { PreferenceCalculator } from '@/utils/preferences';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { LoadingState } from '@/components/LoadingState';
import { SwipeIndicator } from '@/components/SwipeIndicator';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useImagePreloader } from '@/hooks/useImagePreloader';

export const VotingScreen: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, isAnonymous, signInAnonymously } = useAuth();
  const { addVote, getVoteStats } = useVotingHistory();
  const { handleError, handleAsyncError } = useErrorHandler('VotingScreen');
  
  const [currentPair, setCurrentPair] = useState<ImagePair | null>(null);
  const [nextPairs, setNextPairs] = useState<ImagePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(true);

  // Real-time vote tracking
  const imageIds = currentPair?.images.map(img => img.imageId) || [];
  const { voteUpdates, isConnected } = useRealtimeVotes(imageIds);

  // Preload next images
  const nextImageUrls = nextPairs.flatMap(pair => 
    pair.images.map(img => img.url)
  );
  useImagePreloader(nextImageUrls, { preloadCount: 6 });

  const loadImagePair = useCallback(async (usePreloaded = false) => {
    try {
      if (usePreloaded && nextPairs.length > 0) {
        // Use preloaded pair
        const [nextPair, ...remainingPairs] = nextPairs;
        setCurrentPair(nextPair);
        setNextPairs(remainingPairs);
        
        // Preload more pairs in background
        if (remainingPairs.length < 2) {
          votingService.getImagePair().then(newPair => {
            setNextPairs(prev => [...prev, newPair]);
          }).catch(handleError);
        }
      } else {
        // Load fresh pair
        setLoading(true);
        setError(null);
        const pair = await votingService.getImagePair();
        setCurrentPair(pair);
        
        // Preload next pairs
        Promise.all([
          votingService.getImagePair(),
          votingService.getImagePair(),
        ]).then(pairs => {
          setNextPairs(pairs);
        }).catch(handleError);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load images. Please try again.';
      setError(errorMessage);
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError, nextPairs]);

  const handleVote = useCallback(async (direction: 'left' | 'right') => {
    if (!currentPair || votingInProgress) return;

    setVotingInProgress(true);
    setShowSwipeIndicator(false);
    
    const winnerIndex = direction === 'left' ? 0 : 1;
    const loserIndex = direction === 'left' ? 1 : 0;
    
    const winner = currentPair.images[winnerIndex];
    const loser = currentPair.images[loserIndex];
    
    const vote: VoteSubmission = {
      winnerId: winner.imageId,
      loserId: loser.imageId,
      category: winner.categories[0] || 'general',
      sessionId: currentPair.sessionId,
    };

    try {
      await votingService.submitVote(vote);
      
      // Add to local history
      addVote({
        winnerId: vote.winnerId,
        loserId: vote.loserId,
        category: vote.category,
        timestamp: new Date().toISOString(),
      });
      
      // Show success feedback
      const stats = getVoteStats();
      if (stats.streak.current > 0 && stats.streak.current % 10 === 0) {
        setSnackbarMessage(`🔥 ${stats.streak.current} day streak!`);
        setSnackbarVisible(true);
      }
      
      // Load next pair (use preloaded if available)
      await loadImagePair(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit vote. Please try again.';
      setError(errorMessage);
      handleError(err);
    } finally {
      setVotingInProgress(false);
    }
  }, [currentPair, votingInProgress, addVote, getVoteStats, loadImagePair]);

  useEffect(() => {
    if (isAuthenticated) {
      loadImagePair();
    }
  }, [isAuthenticated, loadImagePair]);

  if (!isAuthenticated) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome to Voting App
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Start voting to discover your preferences!
        </Text>
        <Button
          mode="contained"
          onPress={signInAnonymously}
          style={styles.startButton}
        >
          Start Voting
        </Button>
      </Surface>
    );
  }

  if (loading && !currentPair) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState 
          message="Finding the perfect match..."
          fullScreen
        />
      </Surface>
    );
  }

  if (error && !currentPair) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error}
        </Text>
        <Button mode="contained" onPress={loadImagePair} style={styles.retryButton}>
          Try Again
        </Button>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {currentPair && (
        <View style={styles.votingContainer}>
          {currentPair.images.map((image, index) => (
            <View
              key={image.imageId}
              style={[
                styles.cardWrapper,
                index === 0 ? styles.topCard : styles.bottomCard,
              ]}
            >
              <VotingCard
                imageUrl={image.url}
                thumbnailUrl={image.thumbnailUrl}
                characterName={image.characterName}
                categories={image.categories}
                onVote={handleVote}
                onImageLoad={() => {
                  // Image loaded successfully
                }}
              />
              {isConnected && voteUpdates.has(image.imageId) && (
                <View style={styles.statsOverlay}>
                  <AnimatedCounter
                    value={voteUpdates.get(image.imageId)?.voteCount || 0}
                    variant="labelSmall"
                    style={styles.statsText}
                    suffix=" votes"
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      
      <SwipeIndicator visible={showSwipeIndicator && currentPair !== null} />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  startButton: {
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    color: 'red',
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  votingContainer: {
    flex: 1,
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  topCard: {
    zIndex: 2,
  },
  bottomCard: {
    zIndex: 1,
  },
  statsOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsText: {
    color: 'white',
  },
  snackbar: {
    bottom: 100,
  },
});