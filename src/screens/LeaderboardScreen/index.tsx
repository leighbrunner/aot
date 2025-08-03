import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { 
  Text, 
  Surface, 
  Chip, 
  SegmentedButtons,
  useTheme,
  Divider,
  Banner,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { leaderboardAPI, type LeaderboardItem, type Period } from '../../services/api/leaderboard/index';
import LeaderboardItem from '../../components/LeaderboardItem';
import { realtimeService } from '../../services/realtime/index';
import LiveVoteCounter from '../../components/LiveVoteCounter';
import ActiveUsersIndicator from '../../components/ActiveUsersIndicator';

const { width: screenWidth } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('all');
  const [category, setCategory] = useState<string | undefined>();
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const updateAnimation = useRef(new Animated.Value(0)).current;
  const lastUpdateTime = useRef(Date.now());
  
  // Categories - in production, these would come from the API
  const categories = ['all', 'ass', 'tits'];
  
  const periodButtons = [
    { value: 'day', label: 'Today', icon: 'calendar-today' },
    { value: 'week', label: 'Week', icon: 'calendar-week' },
    { value: 'month', label: 'Month', icon: 'calendar-month' },
    { value: 'year', label: 'Year', icon: 'calendar' },
    { value: 'all', label: 'All Time', icon: 'trophy' },
  ];
  
  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (
    refresh = false,
    loadMore = false
  ) => {
    if (!refresh && !loadMore) {
      setLoading(true);
    }
    
    try {
      const result = await leaderboardAPI.getTopImages({
        period,
        category: category === 'all' ? undefined : category,
        limit: 20,
        offset: loadMore ? items.length : 0,
      });
      
      if (loadMore) {
        setItems(prev => [...prev, ...result]);
      } else {
        setItems(result);
      }
      
      setNextToken(null);
      setHasMore(result.length === 20);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [period, category, nextToken]);
  
  // Initial load and refresh on filters change
  useEffect(() => {
    fetchLeaderboard();
  }, [period, category]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = realtimeService.subscribeToStatsUpdates(
      (update) => {
        // Check if it's a top image update for current period
        if (update.type === 'topImage' && update.value) {
          const data = JSON.parse(update.value as string);
          
          // Only show update banner if it's been more than 30 seconds
          const now = Date.now();
          if (now - lastUpdateTime.current > 30000) {
            setHasNewUpdates(true);
            lastUpdateTime.current = now;
            
            // Animate the banner
            Animated.sequence([
              Animated.timing(updateAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.delay(5000),
              Animated.timing(updateAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setHasNewUpdates(false);
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setNextToken(null);
    fetchLeaderboard(true);
  };
  
  // Load more on scroll
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && nextToken) {
      setLoadingMore(true);
      fetchLeaderboard(false, true);
    }
  };
  
  // Render item
  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => (
    <LeaderboardItem
      item={item}
      rank={item.rank}
      showRankChange={period !== 'all'}
    />
  );
  
  // Footer component
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };
  
  // Empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="trophy-outline" 
          size={64} 
          color={theme.colors.onSurfaceVariant} 
        />
        <Text variant="titleMedium" style={styles.emptyText}>
          No images found
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          Be the first to vote in this category!
        </Text>
      </View>
    );
  };
  
  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="headlineMedium" style={styles.title}>
        Leaderboard
      </Text>
      
      {/* Live stats */}
      <View style={styles.liveStatsContainer}>
        <LiveVoteCounter showAnimation={false} />
        <ActiveUsersIndicator compact />
      </View>
      
      {/* Period selector */}
      <SegmentedButtons
        value={period}
        onValueChange={(value) => setPeriod(value as Period)}
        buttons={periodButtons}
        style={styles.periodSelector}
        density="small"
      />
      
      {/* Category filter */}
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat || (!category && cat === 'all')}
            onPress={() => setCategory(cat === 'all' ? undefined : cat)}
            style={styles.categoryChip}
            mode="flat"
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Chip>
        ))}
      </View>
      
      <Divider style={styles.divider} />
    </View>
  );
  
  if (loading && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Update banner */}
      {hasNewUpdates && (
        <Animated.View
          style={[
            styles.updateBanner,
            {
              opacity: updateAnimation,
              transform: [
                {
                  translateY: updateAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Banner
            visible={true}
            actions={[
              {
                label: 'Refresh',
                onPress: handleRefresh,
              },
            ]}
            icon="refresh"
            style={styles.banner}
          >
            New votes have changed the rankings!
          </Banner>
        </Animated.View>
      )}
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.imageId}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  periodSelector: {
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginHorizontal: 4,
  },
  divider: {
    marginTop: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  liveStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 16,
  },
  updateBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
});