import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { Image, ImageContentFit } from 'expo-image';
import { BlurView } from 'expo-blur';

interface ProgressiveImageProps {
  thumbnailSource: { uri: string };
  source: { uri: string };
  style?: any;
  contentFit?: ImageContentFit;
  transition?: number;
  blurRadius?: number;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export default function ProgressiveImage({
  thumbnailSource,
  source,
  style,
  contentFit = 'cover',
  transition = 300,
  blurRadius = 20,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const theme = useTheme();
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const thumbnailAnimatedValue = useState(new Animated.Value(0))[0];
  const imageAnimatedValue = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (thumbnailLoaded) {
      Animated.timing(thumbnailAnimatedValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [thumbnailLoaded]);

  useEffect(() => {
    if (imageLoaded) {
      Animated.timing(imageAnimatedValue, {
        toValue: 1,
        duration: transition,
        useNativeDriver: true,
      }).start(() => {
        // Fade out thumbnail after main image loads
        Animated.timing(thumbnailAnimatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [imageLoaded, transition]);

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = (error: any) => {
    setError(true);
    onError?.(error);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Thumbnail with blur */}
      {thumbnailSource && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: thumbnailAnimatedValue,
            },
          ]}
        >
          <Image
            source={thumbnailSource}
            style={StyleSheet.absoluteFillObject}
            contentFit={contentFit}
            onLoad={handleThumbnailLoad}
            cachePolicy="memory-disk"
          />
          {thumbnailLoaded && !imageLoaded && (
            <BlurView
              intensity={blurRadius}
              style={StyleSheet.absoluteFillObject}
              tint="default"
            />
          )}
        </Animated.View>
      )}

      {/* Main image */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: imageAnimatedValue,
          },
        ]}
      >
        <Image
          source={source}
          style={StyleSheet.absoluteFillObject}
          contentFit={contentFit}
          onLoad={handleImageLoad}
          onError={handleImageError}
          cachePolicy="memory-disk"
          priority="high"
        />
      </Animated.View>

      {/* Loading indicator */}
      {!thumbnailLoaded && !imageLoaded && !error && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});