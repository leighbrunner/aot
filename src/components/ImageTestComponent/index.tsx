import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider, useTheme } from 'react-native-paper';
import EnhancedImage from '../EnhancedImage';
import ProgressiveImage from '../ProgressiveImage';
import FallbackImage from '../FallbackImage';
import { useImagePreloader, useImageCache } from '../../services/image/imagePreloader';

const TEST_IMAGES = {
  valid: {
    thumbnail: 'https://picsum.photos/100/150?random=1',
    full: 'https://picsum.photos/400/600?random=1',
  },
  invalid: {
    thumbnail: 'https://invalid-url-that-does-not-exist.com/thumb.jpg',
    full: 'https://invalid-url-that-does-not-exist.com/image.jpg',
  },
  slow: {
    thumbnail: 'https://picsum.photos/100/150?random=2',
    full: 'https://picsum.photos/400/600?random=2&delay=3000',
  },
};

export default function ImageTestComponent() {
  const theme = useTheme();
  const { preloadImages, getStats } = useImagePreloader();
  const { clearCache, getStats: getCacheStats } = useImageCache();
  const [preloadStats, setPreloadStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const handlePreloadTest = async () => {
    const urls = Object.values(TEST_IMAGES).flatMap(img => [img.thumbnail, img.full]);
    await preloadImages(urls);
    setPreloadStats(getStats());
  };

  const handleCacheTest = async () => {
    const stats = await getCacheStats();
    setCacheStats(stats);
  };

  const handleClearCache = async () => {
    await clearCache();
    setCacheStats(await getCacheStats());
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Image Component Test Suite
      </Text>

      {/* Test 1: Enhanced Image with all features */}
      <Card style={styles.card}>
        <Card.Title title="Test 1: Enhanced Image" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Full-featured image with progressive loading and fallback
          </Text>
          <View style={styles.imageContainer}>
            <EnhancedImage
              source={{ uri: TEST_IMAGES.valid.full }}
              thumbnailSource={{ uri: TEST_IMAGES.valid.thumbnail }}
              style={styles.testImage}
              contentFit="cover"
              useProgressive={true}
              onLoad={() => console.log('Enhanced image loaded')}
              onError={() => console.log('Enhanced image error')}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Test 2: Progressive Image */}
      <Card style={styles.card}>
        <Card.Title title="Test 2: Progressive Loading" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Demonstrates blur-to-sharp transition
          </Text>
          <View style={styles.imageContainer}>
            <ProgressiveImage
              source={{ uri: TEST_IMAGES.slow.full }}
              thumbnailSource={{ uri: TEST_IMAGES.slow.thumbnail }}
              style={styles.testImage}
              blurRadius={20}
              transition={1000}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Test 3: Fallback Image with Error */}
      <Card style={styles.card}>
        <Card.Title title="Test 3: Error Handling" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Image with invalid URL to test error state
          </Text>
          <View style={styles.imageContainer}>
            <FallbackImage
              source={{ uri: TEST_IMAGES.invalid.full }}
              fallbackSource={{ uri: TEST_IMAGES.valid.full }}
              style={styles.testImage}
              errorText="Failed to load - Using fallback"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Test 4: Preloading */}
      <Card style={styles.card}>
        <Card.Title title="Test 4: Preloading System" />
        <Card.Content>
          <Button mode="contained" onPress={handlePreloadTest} style={styles.button}>
            Test Preloading
          </Button>
          {preloadStats && (
            <View style={styles.statsContainer}>
              <Text variant="bodySmall">Total Preloaded: {preloadStats.totalPreloaded}</Text>
              <Text variant="bodySmall">Successful: {preloadStats.successfulPreloads}</Text>
              <Text variant="bodySmall">Failed: {preloadStats.failedPreloads}</Text>
              <Text variant="bodySmall">Queue Size: {preloadStats.queueSize}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Test 5: Caching */}
      <Card style={styles.card}>
        <Card.Title title="Test 5: Cache System" />
        <Card.Content>
          <View style={styles.buttonRow}>
            <Button mode="contained" onPress={handleCacheTest} style={styles.button}>
              Check Cache
            </Button>
            <Button mode="outlined" onPress={handleClearCache} style={styles.button}>
              Clear Cache
            </Button>
          </View>
          {cacheStats && (
            <View style={styles.statsContainer}>
              <Text variant="bodySmall">Total Entries: {cacheStats.totalEntries}</Text>
              <Text variant="bodySmall">
                Oldest: {cacheStats.oldestEntry ? new Date(cacheStats.oldestEntry).toLocaleString() : 'N/A'}
              </Text>
              <Text variant="bodySmall">
                Newest: {cacheStats.newestEntry ? new Date(cacheStats.newestEntry).toLocaleString() : 'N/A'}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />
      
      <Text variant="bodyMedium" style={styles.footer}>
        This test component verifies all image loading features work correctly across platforms.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 12,
    opacity: 0.7,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  testImage: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  button: {
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  divider: {
    marginVertical: 24,
  },
  footer: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.6,
  },
});