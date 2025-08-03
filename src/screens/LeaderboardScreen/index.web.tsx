import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { 
  Text, 
  Surface, 
  Chip, 
  SegmentedButtons,
  useTheme,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { leaderboardAPI, type LeaderboardItem, type Period } from '../../services/api/leaderboard/index';
import LeaderboardItem from '../../components/LeaderboardItem';

const { width: screenWidth } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('all');
  const [category, setCategory] = useState<string | undefined>();
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
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
      
      setHasMore(result.length === 20);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [period, category, items.length]);
  
  // Initial load and refresh on filters change
  useEffect(() => {
    fetchLeaderboard();
  }, [period, category]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(true);
  };
  
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchLeaderboard(false, true);
    }
  };
  
  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => (
    <LeaderboardItem 
      item={item} 
      rank={index + 1}
      showStats
    />
  );
  
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
          buttons={periodButtons.map(btn => ({
            value: btn.value,
            label: btn.label,
            icon: btn.icon,
          }))}
          style={styles.segmentedButtons}
        />
      </View>
      
      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <Text variant="labelMedium" style={styles.categoryLabel}>Category:</Text>
        <View style={styles.categoryChips}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={category === cat || (!category && cat === 'all')}
              onPress={() => setCategory(cat === 'all' ? undefined : cat)}
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Chip>
          ))}
        </View>
      </View>
      
      <Divider />
      
      {/* Leaderboard List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading leaderboard...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.imageId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="trophy-outline" 
                size={64} 
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                No rankings yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Start voting to see the leaderboard!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    marginHorizontal: 0,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryLabel: {
    marginRight: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    height: 32,
  },
  categoryChipText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.8,
  },
  emptySubtext: {
    marginTop: 8,
    opacity: 0.6,
  },
});