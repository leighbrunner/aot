import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ProgressiveImage from '../ProgressiveImage';
import FallbackImage from '../FallbackImage';

interface EnhancedImageProps {
  source: { uri: string };
  thumbnailSource?: { uri: string };
  fallbackSource?: { uri: string };
  style?: any;
  contentFit?: any;
  transition?: number;
  blurRadius?: number;
  onLoad?: () => void;
  onError?: () => void;
  showErrorIcon?: boolean;
  errorText?: string;
  useProgressive?: boolean;
}

export default function EnhancedImage({
  source,
  thumbnailSource,
  fallbackSource,
  style,
  contentFit = 'cover',
  transition = 300,
  blurRadius = 20,
  onLoad,
  onError,
  showErrorIcon = true,
  errorText = 'Failed to load image',
  useProgressive = true,
}: EnhancedImageProps) {
  const theme = useTheme();
  const [primaryError, setPrimaryError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const handlePrimaryError = () => {
    setPrimaryError(true);
    if (!fallbackSource) {
      onError?.();
    }
  };

  const handleFallbackError = () => {
    setFallbackError(true);
    onError?.();
  };

  // If both primary and fallback failed, show error state
  if (primaryError && (!fallbackSource || fallbackError)) {
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

  // If primary failed but we have fallback, use fallback
  if (primaryError && fallbackSource) {
    return (
      <FallbackImage
        source={fallbackSource}
        style={style}
        contentFit={contentFit}
        transition={transition}
        onLoad={onLoad}
        onError={handleFallbackError}
        showErrorIcon={showErrorIcon}
        errorText={errorText}
      />
    );
  }

  // Use progressive loading if thumbnail is available
  if (useProgressive && thumbnailSource) {
    return (
      <ProgressiveImage
        source={source}
        thumbnailSource={thumbnailSource}
        style={style}
        contentFit={contentFit}
        transition={transition}
        blurRadius={blurRadius}
        onLoad={onLoad}
        onError={handlePrimaryError}
      />
    );
  }

  // Otherwise use regular fallback image
  return (
    <FallbackImage
      source={source}
      fallbackSource={fallbackSource}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder={thumbnailSource?.uri}
      onLoad={onLoad}
      onError={handlePrimaryError}
      showErrorIcon={showErrorIcon}
      errorText={errorText}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
});