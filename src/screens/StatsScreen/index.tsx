import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  ProgressBar,
  Divider,
  Card,
  Chip,
  List,
  Avatar,
  FAB,
  Menu,
} from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userStatsAPI, type UserStats } from '../../services/api/userStats';
import { useAuthContext } from '../../contexts/AuthContext';
import StatsCard from '../../components/StatsCard';
import AchievementCard from '../../components/AchievementCard';
import VotingHeatmap from '../../components/VotingHeatmap';
import PreferenceChart from '../../components/PreferenceChart';

const { width: screenWidth } = Dimensions.get('window');

export default function StatsScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (!user?.userId) return;

    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const userStats = await userStatsAPI.getUserStats(user.userId);
      setStats(userStats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(true);
  };

  const exportToJSON = async () => {
    if (!stats) return;
    
    try {
      setExporting(true);
      const jsonData = JSON.stringify(stats, null, 2);
      const fileName = `voting-stats-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Voting Stats',
        });
      } else {
        Alert.alert('Success', 'Stats exported to: ' + fileName);
      }
    } catch (error) {
      console.error('Failed to export stats:', error);
      Alert.alert('Error', 'Failed to export statistics');
    } finally {
      setExporting(false);
      setMenuVisible(false);
    }
  };

  const exportToCSV = async () => {
    if (!stats) return;
    
    try {
      setExporting(true);
      
      // Create CSV content
      let csv = 'Voting Statistics Export\n';
      csv += `Generated on: ${new Date().toLocaleString()}\n\n`;
      
      // Basic Stats
      csv += 'Basic Statistics\n';
      csv += 'Metric,Value\n';
      csv += `Total Votes,${stats.basicStats.totalVotes}\n`;
      csv += `Current Streak,${stats.basicStats.currentStreak} days\n`;
      csv += `Longest Streak,${stats.basicStats.longestStreak} days\n`;
      csv += `Member Since,${new Date(stats.basicStats.memberSince).toLocaleDateString()}\n\n`;
      
      // Preferences
      csv += 'Preferences\n';
      csv += 'Category,Percentage\n';
      Object.entries(stats.preferences.categoryBreakdown).forEach(([category, percentage]) => {
        csv += `${category},${percentage}%\n`;
      });
      csv += '\n';
      
      // Voting Patterns
      csv += 'Voting Patterns\n';
      csv += `Most Active Hour,${stats.votingPatterns.mostActiveHour}:00\n`;
      csv += `Most Active Day,${stats.votingPatterns.mostActiveDay}\n`;
      csv += `Daily Average,${stats.votingPatterns.averageVotesPerDay} votes\n\n`;
      
      // Recent Activity
      csv += 'Recent Activity\n';
      csv += 'Date,Winner,Category\n';
      stats.recentActivity.forEach(activity => {
        csv += `${new Date(activity.timestamp).toLocaleDateString()},${activity.winnerName},${activity.category}\n`;
      });
      
      const fileName = `voting-stats-${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csv);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Your Voting Stats',
        });
      } else {
        Alert.alert('Success', 'Stats exported to: ' + fileName);
      }
    } catch (error) {
      console.error('Failed to export stats:', error);
      Alert.alert('Error', 'Failed to export statistics');
    } finally {
      setExporting(false);
      setMenuVisible(false);
    }
  };

  const shareStats = async () => {
    if (!stats) return;
    
    try {
      const message = `🏆 My Voting Stats\n\n` +
        `Total Votes: ${stats.basicStats.totalVotes.toLocaleString()}\n` +
        `Current Streak: ${stats.basicStats.currentStreak} days 🔥\n` +
        `I'm ${stats.preferences.preferenceScore}% a ${stats.preferences.primaryPreference} person!\n\n` +
        `Top ${stats.comparativeStats.percentile}% of all voters\n` +
        `${stats.comparativeStats.avgVotesVsOthers}x more active than average\n\n` +
        `Join me on the voting app!`;
      
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: 'My Voting Stats',
          text: message,
        });
      } else if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(message);
      } else {
        Alert.alert('Share Stats', message);
      }
    } catch (error) {
      console.error('Failed to share stats:', error);
    } finally {
      setMenuVisible(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your stats...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="chart-line-variant"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="titleMedium" style={styles.errorText}>
          {error || 'No statistics available'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Basic Stats Overview */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Overview
        </Text>
        <View style={styles.statsGrid}>
          <StatsCard
            icon="vote"
            label="Total Votes"
            value={stats.basicStats.totalVotes.toLocaleString()}
            color={theme.colors.primary}
          />
          <StatsCard
            icon="fire"
            label="Current Streak"
            value={`${stats.basicStats.currentStreak} days`}
            color="#FF6B6B"
          />
          <StatsCard
            icon="trophy"
            label="Longest Streak"
            value={`${stats.basicStats.longestStreak} days`}
            color="#FFD700"
          />
          <StatsCard
            icon="calendar-clock"
            label="Member Since"
            value={new Date(stats.basicStats.memberSince).toLocaleDateString()}
            color={theme.colors.tertiary}
          />
        </View>
      </Surface>

      {/* Preferences */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Your Preferences
        </Text>
        {stats.preferences.primaryPreference && (
          <View style={styles.preferenceHeader}>
            <Text variant="headlineMedium">
              You're {stats.preferences.preferenceScore}% a{' '}
              <Text style={{ color: theme.colors.primary }}>
                {stats.preferences.primaryPreference}
              </Text>{' '}
              person!
            </Text>
          </View>
        )}
        <PreferenceChart breakdown={stats.preferences.categoryBreakdown} />
      </Surface>

      {/* Voting Patterns */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Voting Patterns
        </Text>
        <View style={styles.patternRow}>
          <View style={styles.patternItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium">Most active at</Text>
            <Text variant="titleMedium">
              {stats.votingPatterns.mostActiveHour}:00
            </Text>
          </View>
          <View style={styles.patternItem}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={24}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium">Favorite day</Text>
            <Text variant="titleMedium">{stats.votingPatterns.mostActiveDay}</Text>
          </View>
          <View style={styles.patternItem}>
            <MaterialCommunityIcons
              name="chart-line"
              size={24}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium">Daily average</Text>
            <Text variant="titleMedium">
              {stats.votingPatterns.averageVotesPerDay} votes
            </Text>
          </View>
        </View>
        
        {/* Voting Heatmap */}
        <VotingHeatmap data={stats.votingPatterns.votingHeatmap} />
      </Surface>

      {/* Achievements */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Achievements
        </Text>
        <View style={styles.achievementsGrid}>
          {stats.achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              theme={theme}
            />
          ))}
        </View>
      </Surface>

      {/* Recent Activity */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Activity
        </Text>
        <List.Section>
          {stats.recentActivity.map((activity, index) => (
            <List.Item
              key={activity.voteId}
              title={activity.winnerName}
              description={`Voted in ${activity.category} • ${new Date(
                activity.timestamp
              ).toLocaleDateString()}`}
              left={(props) => (
                <Avatar.Image
                  {...props}
                  size={48}
                  source={{ uri: activity.winnerThumbnail }}
                />
              )}
              style={styles.activityItem}
            />
          ))}
        </List.Section>
      </Surface>

      {/* Comparative Stats */}
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          How You Compare
        </Text>
        <View style={styles.compareContainer}>
          <View style={styles.compareItem}>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              Top {stats.comparativeStats.percentile}%
            </Text>
            <Text variant="bodyMedium">of all voters</Text>
          </View>
          <Divider style={styles.verticalDivider} />
          <View style={styles.compareItem}>
            <Text variant="displaySmall" style={{ color: theme.colors.tertiary }}>
              {stats.comparativeStats.avgVotesVsOthers}x
            </Text>
            <Text variant="bodyMedium">more active than average</Text>
          </View>
        </View>
      </Surface>
    </ScrollView>

    {/* Export FAB */}
    <FAB.Group
      open={menuVisible}
      icon={menuVisible ? 'close' : 'download'}
      actions={[
        {
          icon: 'share-variant',
          label: 'Share Stats',
          onPress: shareStats,
        },
        {
          icon: 'file-delimited',
          label: 'Export as CSV',
          onPress: exportToCSV,
        },
        {
          icon: 'code-json',
          label: 'Export as JSON',
          onPress: exportToJSON,
        },
      ]}
      onStateChange={({ open }) => setMenuVisible(open)}
      onPress={() => {
        if (menuVisible) {
          setMenuVisible(false);
        }
      }}
      visible
      fabStyle={styles.fab}
      style={styles.fabGroup}
      color={theme.colors.onPrimary}
      backdropColor="rgba(0, 0, 0, 0.5)"
      loading={exporting}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 24,
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
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
  section: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  patternItem: {
    alignItems: 'center',
    gap: 4,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityItem: {
    paddingVertical: 8,
  },
  compareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  compareItem: {
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 60,
  },
  fab: {
    backgroundColor: 'transparent',
  },
  fabGroup: {
    paddingBottom: 16,
  },
});