import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface FallbackImageProps {
  source: { uri: string };
  fallbackSource?: { uri: string };
  style?: any;
  contentFit?: string;
  placeholder?: string;
  transition?: number;
  onLoad?: () => void;
  onError?: () => void;
  showErrorIcon?: boolean;
  errorText?: string;
}

export default function FallbackImage({
  source,
  fallbackSource,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 300,
  onLoad,
  onError,
  showErrorIcon = true,
  errorText = 'Failed to load image',
}: FallbackImageProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSource, setCurrentSource] = useState(source.uri);
  const [showPlaceholder, setShowPlaceholder] = useState(!!placeholder);

  useEffect(() => {
    setCurrentSource(source.uri);
    setError(false);
    setLoading(true);
  }, [source.uri]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    setShowPlaceholder(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    
    // Try fallback source if available and not already tried
    if (fallbackSource && currentSource !== fallbackSource.uri) {
      setCurrentSource(fallbackSource.uri);
      setLoading(true);
    } else {
      setError(true);
      setShowPlaceholder(false);
      onError?.();
    }
  };

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

  if (error) {
    return (
      <View style={[styles.container, style, { backgroundColor: theme.colors.surfaceVariant }]}>
        {showErrorIcon && (
          <MaterialIcons 
            name="broken-image" 
            size={48} 
            color={theme.colors.onSurfaceVariant} 
          />
        )}
        <Text 
          variant="bodySmall" 
          style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}
        >
          {errorText}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {showPlaceholder && placeholder && (
        <img
          src={placeholder}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: getObjectFit(),
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <img
        src={currentSource}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: getObjectFit(),
          opacity: loading ? 0 : 1,
          transition: `opacity ${transition}ms ease-in-out`,
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {loading && (
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as any,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
});