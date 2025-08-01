import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Surface, Text, useTheme, SegmentedButtons, Card, List, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LeaderboardItem {
  rank: number;
  imageId: string;
  image: {
    url: string;
    thumbnailUrl: string;
    characterName: string;
    categories: string[];
  };
  stats: {
    voteCount: number;
    winCount: number;
    winRate: number;
  };
}

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export const LeaderboardScreen: React.FC = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('day');
  const [category, setCategory] = useState<string | null>(null);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${process.env.API_ENDPOINT}/leaderboards/${period}${category ? `?category=${category}` : ''}`,
        {
          headers: {
            'Authorization': 'Bearer ' + (await getAuthToken()),
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  const renderLeaderboardItem = (item: LeaderboardItem) => {
    const isTop3 = item.rank <= 3;
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    
    return (
      <Card key={item.imageId} style={styles.itemCard} mode="elevated">
        <Card.Content style={styles.itemContent}>
          <View style={styles.rankContainer}>
            {isTop3 ? (
              <MaterialCommunityIcons
                name="medal"
                size={32}
                color={medalColors[item.rank - 1]}
              />
            ) : (
              <Text variant="titleLarge" style={styles.rankText}>
                #{item.rank}
              </Text>
            )}
          </View>
          
          <Image
            source={{ uri: item.image.thumbnailUrl || item.image.url }}
            style={styles.thumbnail}
          />
          
          <View style={styles.infoContainer}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.image.characterName}
            </Text>
            <View style={styles.categoriesRow}>
              {item.image.categories.slice(0, 2).map((cat, index) => (
                <Chip key={index} compact style={styles.categoryChip}>
                  {cat}
                </Chip>
              ))}
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="labelSmall" style={styles.statLabel}>Win Rate</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                {(item.stats.winRate * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="labelSmall" style={styles.statLabel}>Votes</Text>
              <Text variant="titleMedium" style={styles.statValue}>
                {item.stats.voteCount.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && items.length === 0) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
          buttons={[
            { value: 'day', label: 'Today' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
            { value: 'all', label: 'All Time' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>No data available for this period</Text>
        ) : (
          items.map(renderLeaderboardItem)
        )}
      </ScrollView>
    </Surface>
  );
};

// Stub for auth token
async function getAuthToken(): Promise<string> {
  // This will be replaced with actual auth service
  return '';
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
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: 'bold',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  categoryChip: {
    height: 24,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statItem: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.6,
  },
  statValue: {
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    padding: 20,
  },
});