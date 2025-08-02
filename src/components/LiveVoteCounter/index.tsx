import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { realtimeService } from '../../services/realtime/realtimeService';

interface LiveVoteCounterProps {
  initialCount?: number;
  showAnimation?: boolean;
}

export default function LiveVoteCounter({ 
  initialCount = 0, 
  showAnimation = true 
}: LiveVoteCounterProps) {
  const theme = useTheme();
  const [voteCount, setVoteCount] = useState(initialCount);
  const [recentVotes, setRecentVotes] = useState<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get initial stats
    realtimeService.getLatestStats().then(stats => {
      const totalVotesUpdate = stats.find(s => s.type === 'totalVotes');
      if (totalVotesUpdate && totalVotesUpdate.value) {
        const totalVotes = JSON.parse(totalVotesUpdate.value as string).count;
        setVoteCount(totalVotes);
      }
    }).catch(console.error);

    // Subscribe to real-time updates
    const subscription = realtimeService.subscribeToStatsUpdates(
      (update) => {
        if (update.type === 'totalVotes' && update.value) {
          const newCount = JSON.parse(update.value as string).count;
          animateCountChange(newCount);
          
          // Track recent votes for rate calculation
          const now = Date.now();
          setRecentVotes(prev => [...prev, now].filter(t => now - t < 60000)); // Keep last minute
        }
      },
      (error) => {
        console.error('Failed to subscribe to vote updates:', error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const animateCountChange = (newCount: number) => {
    if (showAnimation) {
      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Animate count change
    Animated.timing(countAnim, {
      toValue: newCount - voteCount,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      setVoteCount(newCount);
      countAnim.setValue(0);
    });
  };

  const votesPerMinute = recentVotes.length;
  const isActive = votesPerMinute > 0;

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="vote"
          size={24}
          color={theme.colors.primary}
        />
        <Text variant="titleMedium" style={styles.title}>
          Live Voting
        </Text>
        {isActive && (
          <View style={[styles.indicator, { backgroundColor: theme.colors.error }]} />
        )}
      </View>

      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
        <Text variant="displayMedium" style={styles.count}>
          {voteCount.toLocaleString()}
        </Text>
      </Animated.View>

      <Text variant="bodyMedium" style={styles.label}>
        Total Votes
      </Text>

      {votesPerMinute > 0 && (
        <View style={styles.rateContainer}>
          <MaterialCommunityIcons
            name="trending-up"
            size={16}
            color={theme.colors.primary}
          />
          <Text variant="labelSmall" style={styles.rate}>
            {votesPerMinute} votes/min
          </Text>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginLeft: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  count: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  label: {
    opacity: 0.7,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  rate: {
    opacity: 0.7,
  },
});