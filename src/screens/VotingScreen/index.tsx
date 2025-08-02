import React from 'react';
export { default } from './VotingScreen';

// Legacy implementation preserved below for reference
/*
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { votingAPI, type ImagePair } from '../../services/api/voting';
import { useAuthContext } from '../../contexts/AuthContext';
import { useVotingStore } from '../../store/voting.store';
import { useImagePreloader } from '../../services/image/imagePreloader';
import { useImageCache } from '../../services/image/imageCache';
import EnhancedImage from '../../components/EnhancedImage';
*/

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_SIZE = screenWidth * 0.45;

export default function VotingScreen() {
  const { user } = useAuthContext();
  const { addVote, incrementStreak } = useVotingStore();
  const { preloadImages, queuePreload } = useImagePreloader();
  const { cacheImage } = useImageCache();
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [imagePair, setImagePair] = useState<ImagePair[] | null>(null);
  const [nextPairs, setNextPairs] = useState<ImagePair[][]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  // Categories - in production, these would come from the API
  const categories = ['ass', 'tits', 'all'];

  useEffect(() => {
    loadImagePair();
  }, [selectedCategory]);

  const loadImagePair = async (usePreloaded = false) => {
    try {
      if (usePreloaded && nextPairs.length > 0) {
        // Use preloaded pair
        const [nextPair, ...remainingPairs] = nextPairs;
        setImagePair(nextPair);
        setNextPairs(remainingPairs);
        
        // Preload more pairs in background
        if (remainingPairs.length < 2) {
          preloadNextPairs();
        }
      } else {
        // Load fresh pair
        setLoading(true);
        const response = await votingAPI.getImagePair(
          selectedCategory === 'all' ? undefined : selectedCategory
        );
        setImagePair(response.images);
        setSessionId(response.sessionId);
        
        // Preload next pairs
        preloadNextPairs();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const preloadNextPairs = useCallback(async () => {
    try {
      // Fetch next 2 pairs
      const pairs = await Promise.all([
        votingAPI.getImagePair(selectedCategory === 'all' ? undefined : selectedCategory),
        votingAPI.getImagePair(selectedCategory === 'all' ? undefined : selectedCategory),
      ]);
      
      // Add to next pairs
      setNextPairs(prev => [...prev, ...pairs.map(p => p.images)]);
      
      // Preload all images from these pairs
      const imageUrls = pairs.flatMap(p => 
        p.images.flatMap(img => [img.url, img.thumbnailUrl])
      );
      queuePreload(imageUrls);
      
      // Cache images with metadata
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
      console.warn('Failed to preload next pairs', error);
    }
  }, [selectedCategory, queuePreload, cacheImage]);

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
          id: result.voteId,
          winnerId,
          loserId,
          category: selectedCategory || 'all',
          timestamp: new Date().toISOString(),
        });
        incrementStreak();

        // Load next pair (use preloaded if available)
        await loadImagePair(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const renderImage = (image: ImagePair, position: 'left' | 'right') => {
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
          <EnhancedImage
            source={{ uri: image.url }}
            thumbnailSource={{ uri: image.thumbnailUrl }}
            fallbackSource={{ uri: image.thumbnailUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            blurRadius={20}
            useProgressive={true}
            showErrorIcon={true}
            errorText="Image unavailable"
          />
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
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  imageSurface: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 0.67,
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