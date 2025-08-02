import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import { Card, Text, useTheme, IconButton, Surface } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import EnhancedImage from '../EnhancedImage';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.65;
const SWIPE_THRESHOLD = screenWidth * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 800;

interface VotingCardProps {
  imageUrl: string;
  thumbnailUrl?: string;
  characterName: string;
  categories: string[];
  rating?: number;
  onVote: (direction: 'left' | 'right') => void;
  onImageLoad?: () => void;
  isActive?: boolean;
}

export default function VotingCard({
  imageUrl,
  thumbnailUrl,
  characterName,
  categories,
  rating,
  onVote,
  onImageLoad,
  isActive = true,
}: VotingCardProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleVote = useCallback((direction: 'left' | 'right') => {
    'worklet';
    if (Platform.OS !== 'web') {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }
    runOnJS(onVote)(direction);
  }, [onVote]);

  const resetPosition = useCallback(() => {
    'worklet';
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1);
  }, []);

  const animateOut = useCallback((direction: 'left' | 'right') => {
    'worklet';
    const targetX = direction === 'left' ? -screenWidth * 1.5 : screenWidth * 1.5;
    const targetY = translateY.value + 100;
    
    translateX.value = withTiming(targetX, { duration: 300 });
    translateY.value = withTiming(targetY, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 }, () => {
      runOnJS(handleVote)(direction);
      // Reset after animation
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
    });
  }, [handleVote]);

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
      
      // Haptic feedback at threshold
      if (Platform.OS !== 'web') {
        const absX = Math.abs(event.translationX);
        if (absX > SWIPE_THRESHOLD * 0.5 && absX < SWIPE_THRESHOLD * 0.6) {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD ||
                         Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;
      
      if (shouldSwipe) {
        animateOut(event.translationX > 0 ? 'right' : 'left');
      } else {
        resetPosition();
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(isActive && Platform.OS === 'web')
    .numberOfTaps(1)
    .onEnd((event) => {
      const tapX = event.x;
      const cardCenterX = CARD_WIDTH / 2;
      animateOut(tapX > cardCenterX ? 'right' : 'left');
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-20, 0, 20],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
    };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <View style={styles.imageContainer}>
              <EnhancedImage
                source={{ uri: imageUrl }}
                thumbnailSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
                style={styles.image}
                contentFit="cover"
                useProgressive={true}
                onLoad={() => {
                  setImageLoaded(true);
                  onImageLoad?.();
                }}
              />
            </View>
            
            <Card.Content style={styles.content}>
              <Text variant="titleLarge" style={styles.characterName} numberOfLines={1}>
                {characterName}
              </Text>
              <View style={styles.metaInfo}>
                <View style={styles.categoriesContainer}>
                  {categories.slice(0, 2).map((category, index) => (
                    <Surface key={index} style={[styles.categoryChip, { backgroundColor: theme.colors.secondaryContainer }]}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
                        {category}
                      </Text>
                    </Surface>
                  ))}
                </View>
                {rating !== undefined && rating > 0 && (
                  <Text variant="bodySmall" style={styles.rating}>
                    {Math.round(rating * 100)}% win
                  </Text>
                )}
              </View>
            </Card.Content>

            {/* Swipe indicators */}
            <Animated.View style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}>
              <View style={styles.overlayContent}>
                <IconButton
                  icon="close"
                  iconColor="white"
                  size={60}
                  style={styles.overlayIcon}
                />
                <Text variant="headlineMedium" style={styles.overlayText}>NOPE</Text>
              </View>
            </Animated.View>
            
            <Animated.View style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}>
              <View style={styles.overlayContent}>
                <IconButton
                  icon="heart"
                  iconColor="white"
                  size={60}
                  style={styles.overlayIcon}
                />
                <Text variant="headlineMedium" style={styles.overlayText}>LIKE</Text>
              </View>
            </Animated.View>
          </Card>
          
          {/* Action buttons */}
          {isActive && (
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.rejectButton, { backgroundColor: theme.colors.error }]}
                onPress={() => animateOut('left')}
              >
                <IconButton icon="close" iconColor="white" size={28} />
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.superLikeButton, { backgroundColor: theme.colors.tertiary }]}
                onPress={() => {
                  // Future feature: super like
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              >
                <IconButton icon="star" iconColor="white" size={28} />
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.acceptButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => animateOut('right')}
              >
                <IconButton icon="heart" iconColor="white" size={28} />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  characterName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  rating: {
    opacity: 0.7,
    marginLeft: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftOverlay: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
  },
  rightOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
  },
  overlayText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionButtons: {
    position: 'absolute',
    bottom: -80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  rejectButton: {},
  superLikeButton: {},
  acceptButton: {},
});