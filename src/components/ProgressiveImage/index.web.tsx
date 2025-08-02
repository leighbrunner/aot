import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

interface ProgressiveImageProps {
  thumbnailSource: { uri: string };
  source: { uri: string };
  style?: any;
  contentFit?: string;
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
  const thumbnailRef = useRef<HTMLImageElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const getObjectFit = () => {
    switch (contentFit) {
      case 'contain':
        return 'contain';
      case 'fill':
        return 'fill';
      case 'none':
        return 'none';
      case 'scale-down':
        return 'scale-down';
      case 'cover':
      default:
        return 'cover';
    }
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = (e: any) => {
    setError(true);
    onError?.(e);
  };

  useEffect(() => {
    // Preload main image
    const img = new Image();
    img.src = source.uri;
  }, [source.uri]);

  return (
    <View style={[styles.container, style]}>
      {/* Thumbnail with blur */}
      {thumbnailSource && (
        <img
          ref={thumbnailRef}
          src={thumbnailSource.uri}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: getObjectFit(),
            filter: thumbnailLoaded && !imageLoaded ? `blur(${blurRadius}px)` : 'none',
            transform: 'scale(1.1)', // Slight scale to hide blur edges
            opacity: imageLoaded ? 0 : 1,
            transition: `opacity ${transition}ms ease-out, filter ${transition}ms ease-out`,
          }}
          onLoad={handleThumbnailLoad}
        />
      )}

      {/* Main image */}
      <img
        ref={imageRef}
        src={source.uri}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: getObjectFit(),
          opacity: imageLoaded ? 1 : 0,
          transition: `opacity ${transition}ms ease-in`,
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />

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
    position: 'relative' as any,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});