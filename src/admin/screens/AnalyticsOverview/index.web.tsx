import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  ActivityIndicator,
  SegmentedButtons,
  Card,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { adminAPI, type AnalyticsData } from '../../services/adminAPI';
import { format } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsOverview() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timePeriod]);

  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const data = await adminAPI.getAnalytics(timePeriod);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics(true);
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    change?: number,
    icon?: string
  ) => (
    <Surface style={styles.metricCard} elevation={2}>
      <View style={styles.metricHeader}>
        <Text variant="labelMedium" style={styles.metricTitle}>
          {title}
        </Text>
        {icon && (
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={theme.colors.primary}
          />
        )}
      </View>
      <Text variant="headlineMedium" style={styles.metricValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      {change !== undefined && (
        <View style={styles.changeContainer}>
          <MaterialCommunityIcons
            name={change >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={change >= 0 ? theme.colors.success : theme.colors.error}
          />
          <Text
            variant="labelSmall"
            style={[
              styles.changeText,
              { color: change >= 0 ? theme.colors.success : theme.colors.error }
            ]}
          >
            {Math.abs(change)}%
          </Text>
        </View>
      )}
    </Surface>
  );

  const renderSimpleChart = (
    title: string,
    data: { labels: string[]; data: number[] }
  ) => (
    <Card style={styles.chartCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.chartTitle}>
          {title}
        </Text>
        <View style={styles.simpleChart}>
          <Text variant="bodyMedium" style={styles.chartPlaceholder}>
            Chart visualization not available on web yet
          </Text>
          <View style={styles.dataPreview}>
            {data.labels.slice(0, 5).map((label, index) => (
              <View key={index} style={styles.dataRow}>
                <Text variant="labelMedium">{label}:</Text>
                <Text variant="bodyMedium">{data.data[index]}</Text>
              </View>
            ))}
            {data.labels.length > 5 && (
              <Text variant="labelSmall" style={styles.moreData}>
                +{data.labels.length - 5} more data points
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </AdminRoute>
    );
  }

  if (error || !analyticsData) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="titleMedium" style={styles.errorText}>
            {error || 'Failed to load analytics'}
          </Text>
          <IconButton
            icon="refresh"
            size={24}
            onPress={() => loadAnalytics()}
          />
        </View>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium">Analytics Overview</Text>
          <SegmentedButtons
            value={timePeriod}
            onValueChange={(value) => setTimePeriod(value as TimePeriod)}
            buttons={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            style={styles.periodSelector}
          />
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Votes',
            analyticsData.totalVotes,
            analyticsData.votesChange,
            'vote'
          )}
          {renderMetricCard(
            'Active Users',
            analyticsData.activeUsers,
            analyticsData.usersChange,
            'account-check'
          )}
          {renderMetricCard(
            'Avg. Session',
            `${analyticsData.avgSessionDuration}m`,
            analyticsData.sessionChange,
            'timer'
          )}
          {renderMetricCard(
            'Engagement Rate',
            `${analyticsData.engagementRate}%`,
            analyticsData.engagementChange,
            'chart-line'
          )}
        </View>

        {/* Charts - simplified for web */}
        {renderSimpleChart('Voting Activity', analyticsData.votingActivity)}
        {renderSimpleChart('Category Performance', analyticsData.categoryPerformance)}

        {/* Demographics */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.chartTitle}>
              User Demographics
            </Text>
            <View style={styles.demographicsGrid}>
              {analyticsData.demographics.map((item, index) => (
                <Surface key={index} style={styles.demographicItem} elevation={1}>
                  <Text variant="titleLarge" style={styles.demographicValue}>
                    {item.value}%
                  </Text>
                  <Text variant="bodyMedium">{item.label}</Text>
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Top Content */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge">Top Performing Content</Text>
              <IconButton
                icon="arrow-right"
                size={24}
                onPress={() => console.log('View all content')}
              />
            </View>
            {analyticsData.topContent.map((item, index) => (
              <Surface key={index} style={styles.contentItem} elevation={1}>
                <View style={styles.contentRank}>
                  <Text variant="titleMedium">#{index + 1}</Text>
                </View>
                <View style={styles.contentInfo}>
                  <Text variant="bodyLarge">{item.name}</Text>
                  <Text variant="bodyMedium" style={styles.contentStats}>
                    {item.votes} votes • {item.winRate}% win rate
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="trophy"
                  size={24}
                  color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                />
              </Surface>
            ))}
          </Card.Content>
        </Card>

        {/* User Insights */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.chartTitle}>
              User Insights
            </Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text variant="displaySmall" style={styles.insightValue}>
                  {analyticsData.newUsers}
                </Text>
                <Text variant="bodyMedium" style={styles.insightLabel}>
                  New Users
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text variant="displaySmall" style={styles.insightValue}>
                  {analyticsData.returningUsers}%
                </Text>
                <Text variant="bodyMedium" style={styles.insightLabel}>
                  Retention Rate
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text variant="displaySmall" style={styles.insightValue}>
                  {analyticsData.avgVotesPerUser}
                </Text>
                <Text variant="bodyMedium" style={styles.insightLabel}>
                  Votes/User
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </AdminRoute>
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
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  periodSelector: {
    marginTop: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 2,
    maxWidth: 300,
    padding: 16,
    borderRadius: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    opacity: 0.7,
  },
  metricValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
  },
  chartTitle: {
    marginBottom: 16,
  },
  simpleChart: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  chartPlaceholder: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 16,
  },
  dataPreview: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moreData: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
  },
  demographicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  demographicItem: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  demographicValue: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  contentRank: {
    width: 40,
    alignItems: 'center',
  },
  contentInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  contentStats: {
    opacity: 0.7,
    marginTop: 2,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightValue: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  insightLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
});