import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  useTheme,
  IconButton,
  Badge,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { realtimeService } from '../../services/realtime/realtimeService';
import { leaderboardAPI, type LeaderboardItem } from '../../services/api/leaderboard';
import EnhancedImage from '../EnhancedImage';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.4;

interface TrendingImagesProps {
  category?: string;
  onImagePress?: (item: LeaderboardItem) => void;
}

export default function TrendingImages({ category, onImagePress }: TrendingImagesProps) {
  const theme = useTheme();
  const [trendingItems, setTrendingItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'hour' | 'day'>('hour');
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTrending();
    
    // Subscribe to trending updates
    const subscription = realtimeService.subscribeToStatsUpdates(
      (update) => {
        if (update.type === 'categoryTrend' && update.value) {
          const data = JSON.parse(update.value as string);
          if (!category || data.category === category) {
            // Pulse animation for new trending
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
            
            // Reload trending
            loadTrending();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [category, period]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      
      // Get trending based on recent vote velocity
      const result = await leaderboardAPI.getLeaderboard({
        period: period === 'hour' ? 'day' : 'week',
        category,
        limit: 10,
      });
      
      // Calculate trend score based on recent votes
      const withTrendScore = result.items.map(item => {
        // In production, this would come from the backend
        const trendScore = Math.random() * 100; // Mock trend score
        return { ...item, trendScore };
      });
      
      // Sort by trend score
      const sorted = withTrendScore.sort((a, b) => b.trendScore - a.trendScore);
      setTrendingItems(sorted.slice(0, 8));
    } catch (error) {
      console.error('Failed to load trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendingItem = (item: LeaderboardItem & { trendScore: number }, index: number) => (
    <TouchableOpacity
      key={item.imageId}
      onPress={() => onImagePress?.(item)}
      activeOpacity={0.8}
    >
      <Animated.View
        style={{
          transform: [{ scale: index === 0 ? pulseAnim : 1 }],
        }}
      >
        <Surface style={styles.trendingCard} elevation={2}>
          {index === 0 && (
            <Badge style={styles.hotBadge} size={24}>
              🔥
            </Badge>
          )}
          
          <View style={styles.rankBadge}>
            <Text variant="labelSmall" style={styles.rankText}>
              #{index + 1}
            </Text>
          </View>
          
          <EnhancedImage
            source={{ uri: item.thumbnailUrl }}
            style={styles.trendingImage}
            contentFit="cover"
            transition={300}
          />
          
          <View style={styles.trendingInfo}>
            <Text variant="labelSmall" numberOfLines={1}>
              {item.characterName}
            </Text>
            <View style={styles.statsRow}>
              <MaterialCommunityIcons
                name="trending-up"
                size={14}
                color={theme.colors.primary}
              />
              <Text variant="labelSmall" style={styles.trendScore}>
                +{Math.round(item.trendScore)}%
              </Text>
            </View>
            <Text variant="labelSmall" style={styles.voteCount}>
              {item.voteCount.toLocaleString()} votes
            </Text>
          </View>
        </Surface>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="fire"
            size={24}
            color={theme.colors.error}
          />
          <Text variant="titleMedium">Trending Now</Text>
        </View>
        
        <View style={styles.periodToggle}>
          <Chip
            selected={period === 'hour'}
            onPress={() => setPeriod('hour')}
            style={styles.periodChip}
            compact
            mode="flat"
          >
            1H
          </Chip>
          <Chip
            selected={period === 'day'}
            onPress={() => setPeriod('day')}
            style={styles.periodChip}
            compact
            mode="flat"
          >
            24H
          </Chip>
        </View>
        
        <IconButton
          icon="refresh"
          size={20}
          onPress={loadTrending}
        />
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3, 4].map(i => (
              <Surface key={i} style={[styles.trendingCard, styles.skeleton]} elevation={1} />
            ))}
          </View>
        ) : (
          trendingItems.map((item, index) => renderTrendingItem(item as any, index))
        )}
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  periodChip: {
    height: 28,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trendingCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeleton: {
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
  },
  trendingImage: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
  },
  trendingInfo: {
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendScore: {
    fontWeight: 'bold',
  },
  voteCount: {
    opacity: 0.7,
    marginTop: 2,
  },
});