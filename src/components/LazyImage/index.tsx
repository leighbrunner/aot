import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';
import { imageOptimizer, ImagePriority } from '../../utils/imageOptimization';

interface LazyImageProps extends Omit<FastImageProps, 'source'> {
  source: string | Source;
  placeholder?: string;
  size?: 'thumbnail' | 'medium' | 'full';
  priority?: 'high' | 'normal' | 'low';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  showLoadingIndicator?: boolean;
  fadeInDuration?: number;
  blurRadius?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  placeholder,
  size = 'medium',
  priority = 'normal',
  onLoadStart,
  onLoadEnd,
  onError,
  containerStyle,
  imageStyle,
  showLoadingIndicator = true,
  fadeInDuration = 300,
  blurRadius = 0,
  ...props
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const placeholderFadeAnim = useRef(new Animated.Value(1)).current;

  // Get optimized image URL
  const imageSource = typeof source === 'string' 
    ? { uri: imageOptimizer.getOptimizedImageUrl(source, size) }
    : source;

  // Get priority value
  const imagePriority = {
    high: ImagePriority.HIGH,
    normal: ImagePriority.NORMAL,
    low: ImagePriority.LOW,
  }[priority];

  useEffect(() => {
    if (!loading && !error) {
      // Fade in main image
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }).start();

      // Fade out placeholder
      Animated.timing(placeholderFadeAnim, {
        toValue: 0,
        duration: fadeInDuration,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error, fadeInDuration]);

  const handleLoadStart = () => {
    setLoading(true);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleError = (errorEvent: any) => {
    setLoading(false);
    setError(true);
    onError?.(errorEvent);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Placeholder or loading state */}
      {(loading || error) && (
        <Animated.View
          style={[
            styles.placeholderContainer,
            { opacity: placeholderFadeAnim },
          ]}
        >
          {placeholder ? (
            <FastImage
              source={{ uri: placeholder }}
              style={[styles.image, imageStyle]}
              blurRadius={blurRadius || 10}
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                imageStyle,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              {showLoadingIndicator && loading && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                />
              )}
            </View>
          )}
        </Animated.View>
      )}

      {/* Main image */}
      {!error && (
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <FastImage
            {...props}
            source={imageSource}
            style={[styles.image, imageStyle]}
            priority={imagePriority}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LazyImage;