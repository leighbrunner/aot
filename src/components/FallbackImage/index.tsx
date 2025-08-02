import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { Image, ImageContentFit } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

interface FallbackImageProps {
  source: { uri: string };
  fallbackSource?: { uri: string };
  style?: any;
  contentFit?: ImageContentFit;
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
  const [currentSource, setCurrentSource] = useState(source);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    
    // Try fallback source if available and not already tried
    if (fallbackSource && currentSource.uri !== fallbackSource.uri) {
      setCurrentSource(fallbackSource);
      setLoading(true);
    } else {
      setError(true);
      onError?.();
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
      <Image
        source={currentSource}
        style={[StyleSheet.absoluteFillObject, style]}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        onLoad={handleLoad}
        onError={handleError}
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