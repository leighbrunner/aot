import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Modal, Platform } from 'react-native';
import { Text, Button, Surface, IconButton, useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VotingTutorialProps {
  visible: boolean;
  onDismiss: () => void;
}

const TUTORIAL_KEY = '@voting_app_tutorial_completed';

export default function VotingTutorial({ visible, onDismiss }: VotingTutorialProps) {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const swipeX = useSharedValue(0);
  const swipeRotate = useSharedValue(0);
  const tapScale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const steps = [
    {
      title: 'Welcome to Voting!',
      description: 'Choose your favorites by swiping or tapping',
      icon: 'hand-wave',
    },
    {
      title: 'Swipe Right to Like',
      description: 'Swipe the card right or tap the heart button if you like it',
      icon: 'heart',
      animation: 'swipe-right',
    },
    {
      title: 'Swipe Left to Pass',
      description: 'Swipe left or tap the X button to see the next one',
      icon: 'close',
      animation: 'swipe-left',
    },
    {
      title: 'Categories',
      description: 'Switch between categories using the chips at the top',
      icon: 'tag-multiple',
    },
    {
      title: 'Undo Votes',
      description: 'Made a mistake? Use the undo button that appears after voting',
      icon: 'undo',
    },
  ];

  // Start animations based on current step
  React.useEffect(() => {
    if (steps[currentStep]?.animation === 'swipe-right') {
      swipeX.value = withRepeat(
        withSequence(
          withSpring(100),
          withDelay(500, withSpring(0))
        ),
        -1,
        false
      );
      swipeRotate.value = withRepeat(
        withSequence(
          withSpring(15),
          withDelay(500, withSpring(0))
        ),
        -1,
        false
      );
    } else if (steps[currentStep]?.animation === 'swipe-left') {
      swipeX.value = withRepeat(
        withSequence(
          withSpring(-100),
          withDelay(500, withSpring(0))
        ),
        -1,
        false
      );
      swipeRotate.value = withRepeat(
        withSequence(
          withSpring(-15),
          withDelay(500, withSpring(0))
        ),
        -1,
        false
      );
    } else {
      swipeX.value = withSpring(0);
      swipeRotate.value = withSpring(0);
    }
  }, [currentStep]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: swipeX.value },
      { rotate: `${swipeRotate.value}deg` },
    ],
  }));

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (error) {
      console.error('Failed to save tutorial completion:', error);
    }
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        <Surface style={[styles.content, { backgroundColor: theme.colors.surface }]} elevation={5}>
          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index === currentStep 
                      ? theme.colors.primary 
                      : theme.colors.surfaceVariant,
                  },
                ]}
              />
            ))}
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={steps[currentStep].icon as any}
              size={80}
              color={theme.colors.primary}
            />
          </View>

          {/* Demo card (for swipe steps) */}
          {(currentStep === 1 || currentStep === 2) && (
            <Animated.View style={[styles.demoCard, cardAnimatedStyle]}>
              <Surface style={styles.demoCardSurface} elevation={2}>
                <View style={styles.demoCardImage} />
                <Text variant="bodyMedium" style={styles.demoCardText}>
                  Sample Card
                </Text>
              </Surface>
            </Animated.View>
          )}

          {/* Text content */}
          <Text variant="headlineMedium" style={styles.title}>
            {steps[currentStep].title}
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            {steps[currentStep].description}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="text"
              onPress={handleSkip}
              style={styles.button}
            >
              Skip
            </Button>
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.button}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </View>

          {/* Close button */}
          <IconButton
            icon="close"
            size={24}
            onPress={handleSkip}
            style={styles.closeButton}
          />
        </Surface>
      </View>
    </Modal>
  );
}

// Hook to check if tutorial should be shown
export function useShouldShowTutorial() {
  const [shouldShow, setShouldShow] = useState(false);

  React.useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
      setShouldShow(completed !== 'true');
    } catch (error) {
      console.error('Failed to check tutorial status:', error);
      setShouldShow(false);
    }
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_KEY);
      setShouldShow(true);
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
    }
  };

  return { shouldShow, resetTutorial };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    marginBottom: 24,
  },
  demoCard: {
    width: 150,
    height: 200,
    marginBottom: 24,
  },
  demoCardSurface: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  demoCardImage: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  demoCardText: {
    padding: 8,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    minWidth: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});