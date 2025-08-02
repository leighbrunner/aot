import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, ProgressBar, Surface, useTheme, IconButton } from 'react-native-paper';
import { useVotingStore } from '../../store/voting.store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DailyGoal() {
  const theme = useTheme();
  const { dailyGoal, currentStreak } = useVotingStore();
  const celebrationScale = useSharedValue(1);
  
  React.useEffect(() => {
    if (dailyGoal?.completed) {
      // Celebration animation
      celebrationScale.value = withSequence(
        withSpring(1.2, { damping: 2 }),
        withSpring(1, { damping: 5 })
      );
    }
  }, [dailyGoal?.completed]);
  
  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));
  
  if (!dailyGoal) {
    return null;
  }
  
  const progress = Math.min(dailyGoal.current / dailyGoal.target, 1);
  const percentage = Math.round(progress * 100);
  
  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons 
            name="target" 
            size={20} 
            color={theme.colors.primary} 
            style={styles.icon}
          />
          <Text variant="titleMedium">Daily Goal</Text>
        </View>
        {currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons 
              name="fire" 
              size={16} 
              color="#FF6B6B" 
            />
            <Text variant="bodySmall" style={styles.streakText}>
              {currentStreak} day streak
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {dailyGoal.current} / {dailyGoal.target} votes
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            {percentage}%
          </Text>
        </View>
        
        <ProgressBar 
          progress={progress} 
          color={dailyGoal.completed ? theme.colors.tertiary : theme.colors.primary}
          style={styles.progressBar}
        />
        
        {dailyGoal.completed && (
          <Animated.View style={[styles.completedContainer, celebrationStyle]}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={24} 
              color={theme.colors.tertiary} 
            />
            <Text 
              variant="bodyMedium" 
              style={[styles.completedText, { color: theme.colors.tertiary }]}
            >
              Goal Complete! 🎉
            </Text>
          </Animated.View>
        )}
      </View>
      
      {!dailyGoal.completed && (
        <Text 
          variant="bodySmall" 
          style={[styles.encouragement, { color: theme.colors.onSurfaceVariant }]}
        >
          {dailyGoal.current === 0 
            ? "Start voting to reach your goal!"
            : dailyGoal.target - dailyGoal.current === 1
            ? "Just one more vote!"
            : `${dailyGoal.target - dailyGoal.current} votes to go!`
          }
        </Text>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    marginLeft: 4,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  completedText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  encouragement: {
    textAlign: 'center',
    marginTop: 4,
  },
});