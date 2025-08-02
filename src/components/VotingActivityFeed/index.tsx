import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Animated, 
  Dimensions,
  Platform,
} from 'react-native';
import { 
  Text, 
  Surface, 
  Avatar, 
  useTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { realtimeService, type VoteActivitySubscription } from '../../services/realtime/realtimeService';
import type { Schema } from '@/amplify/data/resource';

const { width: screenWidth } = Dimensions.get('window');

interface VotingActivityFeedProps {
  category?: string;
  compact?: boolean;
  maxItems?: number;
}

interface AnimatedActivity extends Schema['VoteActivity']['type'] {
  animationValue: Animated.Value;
}

export default function VotingActivityFeed({ 
  category, 
  compact = false,
  maxItems = 20 
}: VotingActivityFeedProps) {
  const theme = useTheme();
  const [activities, setActivities] = useState<AnimatedActivity[]>([]);
  const [isLive, setIsLive] = useState(true);
  const subscriptionRef = useRef<VoteActivitySubscription | null>(null);

  useEffect(() => {
    // Load initial activities
    loadInitialActivities();

    // Subscribe to real-time updates if live
    if (isLive) {
      subscribeToUpdates();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [category, isLive]);

  const loadInitialActivities = async () => {
    try {
      const recentActivities = await realtimeService.getRecentActivity(maxItems);
      const filteredActivities = category 
        ? recentActivities.filter(a => a.category === category)
        : recentActivities;

      setActivities(
        filteredActivities.map(activity => ({
          ...activity,
          animationValue: new Animated.Value(1),
        }))
      );
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const subscribeToUpdates = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const subscription = category
      ? realtimeService.subscribeToCategoryActivity(
          category,
          handleNewActivity,
          handleSubscriptionError
        )
      : realtimeService.subscribeToVoteActivity(
          handleNewActivity,
          handleSubscriptionError
        );

    subscriptionRef.current = subscription;
  };

  const handleNewActivity = (activity: Schema['VoteActivity']['type']) => {
    const animationValue = new Animated.Value(0);
    const newActivity: AnimatedActivity = { ...activity, animationValue };

    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, maxItems);
      
      // Animate new item
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      return updated;
    });
  };

  const handleSubscriptionError = (error: any) => {
    console.error('Activity subscription error:', error);
    setIsLive(false);
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  const renderActivity = ({ item, index }: { item: AnimatedActivity; index: number }) => {
    if (compact) {
      return (
        <Animated.View
          style={[
            styles.compactItem,
            {
              opacity: item.animationValue,
              transform: [
                {
                  translateX: item.animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Avatar.Image 
            size={32} 
            source={{ uri: item.winnerThumbnail }}
            style={styles.compactAvatar}
          />
          <View style={styles.compactContent}>
            <Text variant="labelSmall" numberOfLines={1}>
              {item.anonymizedUsername || 'Someone'} voted for
            </Text>
            <Text variant="labelMedium" numberOfLines={1} style={styles.winnerName}>
              {item.winnerName}
            </Text>
          </View>
          <Text variant="labelSmall" style={styles.timestamp}>
            {getRelativeTime(item.timestamp)}
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          {
            opacity: item.animationValue,
            transform: [
              {
                translateY: item.animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Surface style={styles.activityCard} elevation={1}>
          <View style={styles.activityHeader}>
            <View style={styles.userInfo}>
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium">
                {item.anonymizedUsername || 'Anonymous'}
              </Text>
              {item.country && (
                <Text variant="labelSmall" style={styles.country}>
                  {getFlagEmoji(item.country)}
                </Text>
              )}
            </View>
            <Text variant="labelSmall" style={styles.timestamp}>
              {getRelativeTime(item.timestamp)}
            </Text>
          </View>

          <View style={styles.voteContent}>
            <View style={styles.imageContainer}>
              <Avatar.Image 
                size={60} 
                source={{ uri: item.winnerThumbnail }}
              />
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.primary}
                style={styles.winnerBadge}
              />
            </View>

            <Text variant="bodyLarge" style={styles.vsText}>VS</Text>

            <View style={styles.imageContainer}>
              <Avatar.Image 
                size={60} 
                source={{ uri: item.loserThumbnail }}
                style={styles.loserImage}
              />
            </View>
          </View>

          <View style={styles.activityFooter}>
            <Text variant="bodySmall">
              Voted for <Text style={styles.bold}>{item.winnerName}</Text>
            </Text>
            <Chip compact mode="flat" style={styles.categoryChip}>
              {item.category}
            </Chip>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MaterialCommunityIcons
          name="pulse"
          size={24}
          color={theme.colors.primary}
        />
        <Text variant="titleMedium">Live Activity</Text>
        {isLive && (
          <View style={[styles.liveDot, { backgroundColor: theme.colors.error }]} />
        )}
      </View>
      <IconButton
        icon={isLive ? 'pause' : 'play'}
        size={20}
        onPress={toggleLive}
      />
    </View>
  );

  if (activities.length === 0) {
    return (
      <Surface style={styles.emptyContainer} elevation={1}>
        {renderHeader()}
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons
            name="vote-outline"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.emptyText}>
            No recent voting activity
          </Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, compact && styles.compactContainer]} elevation={1}>
      {!compact && renderHeader()}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.activityId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!compact}
        horizontal={compact}
        showsHorizontalScrollIndicator={false}
      />
    </Surface>
  );
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 400,
  },
  compactContainer: {
    maxHeight: 60,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  activityCard: {
    padding: 12,
    borderRadius: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  country: {
    opacity: 0.7,
  },
  timestamp: {
    opacity: 0.5,
  },
  voteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  winnerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  loserImage: {
    opacity: 0.7,
  },
  vsText: {
    fontWeight: 'bold',
    opacity: 0.5,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  categoryChip: {
    height: 24,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  compactAvatar: {
    marginRight: 4,
  },
  compactContent: {
    flex: 1,
  },
  winnerName: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    borderRadius: 12,
    padding: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    opacity: 0.7,
  },
});