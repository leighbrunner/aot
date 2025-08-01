import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
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
import { LazyImage } from '../LazyImage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;
const SWIPE_THRESHOLD = screenWidth * 0.3;

interface VotingCardProps {
  imageUrl: string;
  thumbnailUrl?: string;
  characterName: string;
  categories: string[];
  onVote: (direction: 'left' | 'right') => void;
  onImageLoad?: () => void;
}

export const VotingCard: React.FC<VotingCardProps> = ({
  imageUrl,
  thumbnailUrl,
  characterName,
  categories,
  onVote,
  onImageLoad,
}) => {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleVote = useCallback((direction: 'left' | 'right') => {
    'worklet';
    runOnJS(onVote)(direction);
  }, [onVote]);

  const resetPosition = useCallback(() => {
    'worklet';
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
  }, []);

  const animateOut = useCallback((direction: 'left' | 'right') => {
    'worklet';
    const targetX = direction === 'left' ? -screenWidth : screenWidth;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(handleVote)(direction);
    });
  }, [handleVote]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        animateOut(event.translationX > 0 ? 'right' : 'left');
      } else {
        resetPosition();
      }
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      const tapX = event.x;
      const cardCenterX = CARD_WIDTH / 2;
      animateOut(tapX > cardCenterX ? 'right' : 'left');
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15],
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

  const overlayOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [1, 0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const leftOverlayOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const rightOverlayOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.imageContainer}>
              <LazyImage
                source={imageUrl}
                placeholder={thumbnailUrl}
                size="medium"
                priority="high"
                imageStyle={styles.image}
                onLoadEnd={() => {
                  setImageLoaded(true);
                  onImageLoad?.();
                }}
                showLoadingIndicator={true}
                fadeInDuration={300}
              />
            </View>
            
            <Card.Content style={styles.content}>
              <Text variant="titleLarge" style={styles.characterName}>
                {characterName}
              </Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category, index) => (
                  <Surface key={index} style={styles.categoryChip}>
                    <Text variant="labelSmall">{category}</Text>
                  </Surface>
                ))}
              </View>
            </Card.Content>

            {/* Swipe indicators */}
            <Animated.View style={[styles.overlay, styles.leftOverlay, leftOverlayOpacity]}>
              <IconButton
                icon="close"
                iconColor="white"
                size={60}
                style={styles.overlayIcon}
              />
            </Animated.View>
            
            <Animated.View style={[styles.overlay, styles.rightOverlay, rightOverlayOpacity]}>
              <IconButton
                icon="heart"
                iconColor="white"
                size={60}
                style={styles.overlayIcon}
              />
            </Animated.View>
          </Card>
          
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => animateOut('left')}
            >
              <IconButton icon="close" iconColor="white" size={30} />
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => animateOut('right')}
            >
              <IconButton icon="heart" iconColor="white" size={30} />
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

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
    elevation: 5,
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
    padding: 15,
  },
  characterName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    elevation: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
  },
  rightOverlay: {
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
  },
  overlayIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 50,
  },
  actionButtons: {
    position: 'absolute',
    bottom: -80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 50,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: '#ff4458',
  },
  acceptButton: {
    backgroundColor: '#4fc3f7',
  },
});