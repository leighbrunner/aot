import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
  Image as RNImage,
  ImageProps as RNImageProps,
} from 'react-native';
import { Image } from 'expo-image';
import { getOptimizedImageUri } from '../../utils/performance/imageOptimizer';
import { trackImageLoad } from '../../utils/performance/performanceMonitor';

interface OptimizedImageProps extends Omit<RNImageProps, 'source'> {
  source: { uri: string };
  thumbnailSource?: { uri: string };
  placeholderColor?: string;
  enableCache?: boolean;
  priority?: 'low' | 'normal' | 'high';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

export default function OptimizedImage({
  source,
  thumbnailSource,
  placeholderColor = '#f0f0f0',
  enableCache = true,
  priority = 'normal',
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  ...props
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUri, setImageUri] = useState(source.uri);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const performanceTracker = useRef(trackImageLoad(source.uri));

  useEffect(() => {
    loadImage();
  }, [source.uri]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(false);
      onLoadStart?.();

      // Get optimized/cached URI
      if (enableCache && Platform.OS !== 'web') {
        const optimizedUri = await getOptimizedImageUri(source.uri);
        setImageUri(optimizedUri);
      } else {
        setImageUri(source.uri);
      }
    } catch (err) {
      console.error('Failed to load image:', err);
      setError(true);
      onError?.(err);
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
    performanceTracker.current.onLoadEnd();
    onLoadEnd?.();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleError = (error: any) => {
    setLoading(false);
    setError(true);
    performanceTracker.current.onError();
    onError?.(error);
  };

  // Use expo-image on native for better performance
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        {loading && (
          <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: placeholderColor }]}>
            <ActivityIndicator size="small" />
          </View>
        )}
        
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: imageUri }}
            placeholder={thumbnailSource?.uri}
            placeholderContentFit="cover"
            contentFit="cover"
            transition={200}
            priority={priority}
            onLoadStart={onLoadStart}
            onLoad={handleLoadEnd}
            onError={handleError}
            style={StyleSheet.absoluteFill}
            {...props}
          />
        </Animated.View>
      </View>
    );
  }

  // Use standard Image on web
  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" />
        </View>
      )}
      
      <Animated.Image
        source={{ uri: imageUri }}
        onLoadStart={onLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});