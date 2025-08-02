import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import VotingCard from '../VotingCard';
import { votingAPI, type ImagePair } from '../../services/api/voting';

const { height: screenHeight } = Dimensions.get('window');

interface VotingCardStackProps {
  category?: string;
  onVote: (winnerId: string, loserId: string, direction: 'left' | 'right') => void;
  preloadedPairs?: ImagePair[][];
}

export default function VotingCardStack({
  category,
  onVote,
  preloadedPairs = [],
}: VotingCardStackProps) {
  const theme = useTheme();
  const [cards, setCards] = useState<ImagePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Animation values for stack effect
  const stackScale = useSharedValue(0.95);
  const stackTranslateY = useSharedValue(20);
  const stackOpacity = useSharedValue(0.8);

  // Load initial cards
  useEffect(() => {
    if (preloadedPairs.length > 0) {
      setCards(preloadedPairs.flat());
    } else {
      loadMoreCards();
    }
  }, [category]);

  const loadMoreCards = async () => {
    try {
      const response = await votingAPI.getImagePair(category);
      setCards(prev => [...prev, ...response.images]);
    } catch (error) {
      console.error('Failed to load more cards:', error);
    }
  };

  const handleCardVote = useCallback((direction: 'left' | 'right') => {
    if (isTransitioning || currentIndex >= cards.length - 1) return;

    const currentCard = cards[currentIndex];
    const nextCard = cards[currentIndex + 1];
    
    if (!currentCard || !nextCard) return;

    setIsTransitioning(true);

    // Determine winner/loser based on vote direction
    const winnerId = direction === 'right' ? currentCard.id : nextCard.id;
    const loserId = direction === 'right' ? nextCard.id : currentCard.id;

    // Animate stack
    stackScale.value = withSpring(1, { damping: 20 });
    stackTranslateY.value = withSpring(0, { damping: 20 });
    stackOpacity.value = withSpring(1, { damping: 20 });

    // Call parent vote handler
    onVote(winnerId, loserId, direction);

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsTransitioning(false);
      
      // Reset stack animation
      stackScale.value = withSpring(0.95);
      stackTranslateY.value = withSpring(20);
      stackOpacity.value = withSpring(0.8);
      
      // Load more cards if running low
      if (currentIndex >= cards.length - 3) {
        loadMoreCards();
      }
    }, 300);
  }, [currentIndex, cards, isTransitioning, onVote]);

  const bottomCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: stackScale.value },
      { translateY: stackTranslateY.value },
    ],
    opacity: stackOpacity.value,
  }));

  const renderCard = (card: ImagePair, index: number) => {
    const isTop = index === currentIndex;
    const isNext = index === currentIndex + 1;

    if (!isTop && !isNext) return null;

    return (
      <Animated.View
        key={card.id}
        style={[
          styles.cardWrapper,
          !isTop && bottomCardStyle,
          { zIndex: isTop ? 2 : 1 },
        ]}
      >
        <VotingCard
          imageUrl={card.url}
          thumbnailUrl={card.thumbnailUrl}
          characterName={card.characterName}
          categories={card.categories}
          rating={card.rating}
          onVote={isTop ? handleCardVote : () => {}}
          isActive={isTop && !isTransitioning}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {cards.map((card, index) => renderCard(card, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});