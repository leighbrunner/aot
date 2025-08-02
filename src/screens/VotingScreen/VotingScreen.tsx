import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Chip, Snackbar, FAB } from 'react-native-paper';
import { votingAPI, type ImagePair } from '../../services/api/voting';
import { useAuthContext } from '../../contexts/AuthContext';
import { useVotingStore } from '../../store/voting.store';
import { useImagePreloader } from '../../services/image/imagePreloader';
import { useImageCache } from '../../services/image/imageCache';
import VotingCardStack from '../../components/VotingCardStack';
import VotingTutorial, { useShouldShowTutorial } from '../../components/VotingTutorial';
import VotingActivityFeed from '../../components/VotingActivityFeed';
import ActiveUsersIndicator from '../../components/ActiveUsersIndicator';
import * as Haptics from 'expo-haptics';

export default function VotingScreen() {
  const { user } = useAuthContext();
  const { 
    addVote, 
    addPendingVote, 
    resolvePendingVote, 
    removePendingVote,
    updateStreak, 
    updateDailyProgress,
    recentVotes,
    queueSize,
    setQueueSize,
  } = useVotingStore();
  const { preloadImages, queuePreload } = useImagePreloader();
  const { cacheImage } = useImageCache();
  const { shouldShow: shouldShowTutorial, resetTutorial } = useShouldShowTutorial();
  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState<string>('');
  const [preloadedPairs, setPreloadedPairs] = useState<ImagePair[][]>([]);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [lastVote, setLastVote] = useState<{
    winnerId: string;
    loserId: string;
    voteId?: string;
  } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Categories - in production, these would come from the API
  const categories = ['all', 'ass', 'tits'];

  useEffect(() => {
    preloadNextBatch();
  }, [selectedCategory]);

  useEffect(() => {
    // Show tutorial for new users
    if (shouldShowTutorial) {
      setShowTutorial(true);
    }
  }, [shouldShowTutorial]);

  const preloadNextBatch = useCallback(async () => {
    try {
      // Fetch multiple pairs for smoother experience
      const pairs = await Promise.all([
        votingAPI.getImagePair(selectedCategory === 'all' ? undefined : selectedCategory),
        votingAPI.getImagePair(selectedCategory === 'all' ? undefined : selectedCategory),
        votingAPI.getImagePair(selectedCategory === 'all' ? undefined : selectedCategory),
      ]);
      
      const newPairs = pairs.map(p => p.images);
      setPreloadedPairs(prev => [...prev, ...newPairs]);
      
      // Update session ID from first response
      if (pairs[0]?.sessionId) {
        setSessionId(pairs[0].sessionId);
      }
      
      // Preload and cache all images
      const imageUrls = pairs.flatMap(p => 
        p.images.flatMap(img => [img.url, img.thumbnailUrl].filter(Boolean))
      );
      queuePreload(imageUrls);
      
      // Cache with metadata
      pairs.forEach(pair => {
        pair.images.forEach(img => {
          cacheImage(img.url, {
            characterName: img.characterName,
            categories: img.categories,
            rating: img.rating,
          });
          if (img.thumbnailUrl) {
            cacheImage(img.thumbnailUrl, { isThumbnail: true });
          }
        });
      });
    } catch (error) {
      console.error('Failed to preload image pairs:', error);
    }
  }, [selectedCategory, queuePreload, cacheImage]);

  const handleVote = useCallback(async (
    winnerId: string, 
    loserId: string, 
    direction: 'left' | 'right'
  ) => {
    // Create temporary vote ID for optimistic update
    const tempVoteId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const vote = {
      id: tempVoteId,
      winnerId,
      loserId,
      category: selectedCategory || 'all',
      timestamp: new Date().toISOString(),
    };
    
    // Optimistic update
    addPendingVote(vote);
    updateDailyProgress();
    
    // Haptic feedback
    if (direction === 'right') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    try {
      // Submit vote to API
      const result = await votingAPI.submitVote(
        winnerId,
        loserId,
        selectedCategory || 'all',
        sessionId
      );

      if (result.success) {
        if (result.queued) {
          // Vote was queued for offline submission
          setQueueSize(queueSize + 1);
          setShowUndoSnackbar(true);
        } else {
          // Vote was submitted successfully
          resolvePendingVote(tempVoteId, result.voteId!);
          
          // Store last vote for undo
          setLastVote({
            winnerId,
            loserId,
            voteId: result.voteId,
          });
          
          // Update actual vote count and streak
          addVote({
            ...vote,
            id: result.voteId!,
          });
          
          // Update streak if returned from server
          if (result.currentStreak !== undefined && result.longestStreak !== undefined) {
            updateStreak(result.currentStreak, result.longestStreak);
          }
          
          // Show undo option
          setShowUndoSnackbar(true);
        }
        
        // Preload more if running low
        if (preloadedPairs.length < 3) {
          preloadNextBatch();
        }
      } else {
        // Handle errors (e.g., duplicate vote)
        removePendingVote(tempVoteId, result.error);
        Alert.alert('Notice', result.message || 'Vote not counted');
      }
    } catch (error) {
      // Remove optimistic update on error
      removePendingVote(tempVoteId, 'Failed to submit vote');
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    }
  }, [
    selectedCategory, 
    sessionId, 
    addVote, 
    addPendingVote,
    resolvePendingVote,
    removePendingVote,
    updateStreak,
    updateDailyProgress,
    queueSize,
    setQueueSize,
    preloadedPairs.length, 
    preloadNextBatch
  ]);

  const handleUndo = useCallback(async () => {
    if (!lastVote) return;
    
    try {
      // In production, this would call an undo API endpoint
      console.log('Undo vote:', lastVote.voteId);
      
      // Remove from local store (simplified - in production would sync with backend)
      const voteIndex = recentVotes.findIndex(v => v.id === lastVote.voteId);
      if (voteIndex >= 0) {
        // This is simplified - you'd want to properly update the store
        console.log('Removing vote from store');
      }
      
      setLastVote(null);
      setShowUndoSnackbar(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      Alert.alert('Error', 'Failed to undo vote.');
    }
  }, [lastVote, recentVotes]);

  return (
    <View style={styles.container}>
      {/* Category selector */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Choose Your Favorite
        </Text>
        
        {/* Active users indicator */}
        <View style={styles.activeUsers}>
          <ActiveUsersIndicator compact />
        </View>
        
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category || (!selectedCategory && category === 'all')}
              onPress={() => {
                setSelectedCategory(category === 'all' ? undefined : category);
                setPreloadedPairs([]); // Clear current pairs when changing category
              }}
              style={styles.categoryChip}
              mode="flat"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {/* Voting card stack */}
      <View style={styles.cardContainer}>
        <VotingCardStack
          category={selectedCategory}
          onVote={handleVote}
          preloadedPairs={preloadedPairs}
        />
      </View>

      {/* Live activity feed */}
      <View style={styles.activityFeed}>
        <VotingActivityFeed 
          category={selectedCategory} 
          compact
          maxItems={5}
        />
      </View>

      {/* Undo snackbar */}
      <Snackbar
        visible={showUndoSnackbar}
        onDismiss={() => setShowUndoSnackbar(false)}
        duration={5000}
        action={{
          label: 'Undo',
          onPress: handleUndo,
        }}
        style={styles.snackbar}
      >
        Vote submitted!
      </Snackbar>

      {/* Tutorial FAB */}
      <FAB
        icon="help"
        style={styles.fab}
        onPress={() => setShowTutorial(true)}
        size="small"
      />

      {/* Tutorial Modal */}
      <VotingTutorial
        visible={showTutorial}
        onDismiss={() => setShowTutorial(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    marginHorizontal: 4,
  },
  cardContainer: {
    flex: 1,
    marginTop: 20,
  },
  snackbar: {
    bottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  activeUsers: {
    marginBottom: 8,
  },
  activityFeed: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});