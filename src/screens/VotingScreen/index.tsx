import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Surface, Text, useTheme, Snackbar, Button } from 'react-native-paper';
import { VotingCard } from '@/components/VotingCard';
import { votingService, ImagePair, VoteSubmission } from '@/services/api/votingService';
import { useAuth } from '@/contexts/AuthContext';
import { useVotingHistory } from '@/hooks/useVotingHistory';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { PreferenceCalculator } from '@/utils/preferences';

export const VotingScreen: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, isAnonymous, signInAnonymously } = useAuth();
  const { addVote, getVoteStats } = useVotingHistory();
  
  const [currentPair, setCurrentPair] = useState<ImagePair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Real-time vote tracking
  const imageIds = currentPair?.images.map(img => img.imageId) || [];
  const { voteUpdates, isConnected } = useRealtimeVotes(imageIds);

  const loadImagePair = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const pair = await votingService.getImagePair();
      setCurrentPair(pair);
    } catch (err) {
      setError('Failed to load images. Please try again.');
      console.error('Error loading image pair:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVote = useCallback(async (direction: 'left' | 'right') => {
    if (!currentPair || votingInProgress) return;

    setVotingInProgress(true);
    
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
      
      // Load next pair
      await loadImagePair();
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
      console.error('Error submitting vote:', err);
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading images...
        </Text>
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
                  <Text variant="labelSmall" style={styles.statsText}>
                    {voteUpdates.get(image.imageId)?.voteCount || 0} votes
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      
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