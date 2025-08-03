import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { votingAPI, type ImagePair } from '../../services/api/voting/index';
import { useAuth } from '../../contexts/AuthContext';
import { useVotingStore } from '../../store/voting.store';

export default function VotingScreen() {
  const { userId, isAuthenticated } = useAuth();
  const { addVote, updateStreak, currentStreak, longestStreak } = useVotingStore();
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [imagePair, setImagePair] = useState<ImagePair[] | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  // Categories - in production, these would come from the API
  const categories = ['ass', 'tits', 'all'];

  useEffect(() => {
    loadImagePair();
  }, [selectedCategory]);

  const loadImagePair = async () => {
    try {
      setLoading(true);
      setImageLoadErrors(new Set());
      const response = await votingAPI.getImagePair(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setImagePair(response.images);
      setSessionId(response.sessionId);
    } catch (error) {
      alert('Failed to load images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winnerId: string, loserId: string) => {
    if (voting || !imagePair) return;

    try {
      setVoting(true);
      
      // Submit vote to API
      const result = await votingAPI.submitVote(
        winnerId,
        loserId,
        selectedCategory || 'all',
        sessionId
      );

      if (result.success) {
        // Update local store
        addVote({
          id: result.voteId || `vote_${Date.now()}`,
          winnerId,
          loserId,
          category: selectedCategory || 'all',
          timestamp: new Date().toISOString(),
        });
        updateStreak(currentStreak + 1, Math.max(currentStreak + 1, longestStreak));

        // Load next pair
        await loadImagePair();
      } else {
        throw new Error(result.error || 'Vote submission failed');
      }
    } catch (error) {
      alert('Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const handleImageError = (imageId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(imageId));
  };

  const renderImage = (image: ImagePair, position: 'left' | 'right') => {
    const hasError = imageLoadErrors.has(image.id);
    
    return (
      <TouchableOpacity 
        onPress={() => {
          if (!voting && imagePair) {
            const otherImage = imagePair.find(img => img.id !== image.id);
            if (otherImage) {
              handleVote(image.id, otherImage.id);
            }
          }
        }}
        disabled={voting}
        style={styles.imageContainer}
      >
        <Surface style={styles.imageSurface} elevation={2}>
          {hasError ? (
            <View style={[styles.image, styles.errorContainer]}>
              <Text>Failed to load image</Text>
            </View>
          ) : (
            <img
              src={image.url}
              alt={image.characterName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => handleImageError(image.id)}
              loading="lazy"
            />
          )}
          <View style={styles.imageInfo}>
            <Text variant="bodySmall" numberOfLines={1}>
              {image.characterName}
            </Text>
            {image.rating > 0 && (
              <Text variant="bodySmall" style={styles.rating}>
                {Math.round(image.rating * 100)}% win rate
              </Text>
            )}
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading images...</Text>
      </View>
    );
  }

  if (!imagePair || imagePair.length < 2) {
    return (
      <View style={styles.centerContainer}>
        <Text>No images available</Text>
        <Button mode="contained" onPress={loadImagePair} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Choose Your Favorite</Text>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category || (!selectedCategory && category === 'all')}
              onPress={() => setSelectedCategory(category === 'all' ? undefined : category)}
              style={styles.categoryChip}
            >
              {category}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.imagesContainer}>
        {renderImage(imagePair[0], 'left')}
        <View style={styles.vsContainer}>
          <Text variant="titleLarge" style={styles.vsText}>VS</Text>
        </View>
        {renderImage(imagePair[1], 'right')}
      </View>

      {voting && (
        <View style={styles.votingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  categoryChip: {
    marginHorizontal: 4,
  },
  imagesContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 8,
    maxWidth: 400,
    cursor: 'pointer',
  },
  imageSurface: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 0.67,
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfo: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  rating: {
    color: '#666',
    marginTop: 2,
  },
  vsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 10,
  },
  vsText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingText: {
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  votingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});