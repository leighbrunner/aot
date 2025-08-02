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
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { adminAPI, type AnalyticsData } from '../../services/adminAPI';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsOverview() {
  const theme = useTheme();
  const paperTheme = usePaperTheme();
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

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
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

        {/* Voting Activity Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.chartTitle}>
              Voting Activity
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: analyticsData.votingActivity.labels,
                  datasets: [{
                    data: analyticsData.votingActivity.data,
                  }],
                }}
                width={Math.max(chartWidth, analyticsData.votingActivity.labels.length * 50)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Category Performance */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.chartTitle}>
              Category Performance
            </Text>
            <BarChart
              data={{
                labels: analyticsData.categoryPerformance.labels,
                datasets: [{
                  data: analyticsData.categoryPerformance.data,
                }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </Card.Content>
        </Card>

        {/* User Demographics */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.chartTitle}>
              User Demographics
            </Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={analyticsData.demographics.map((item, index) => ({
                  name: item.label,
                  population: item.value,
                  color: [
                    theme.colors.primary,
                    theme.colors.secondary,
                    theme.colors.tertiary,
                    theme.colors.error,
                    theme.colors.warning,
                    theme.colors.success,
                  ][index % 6],
                  legendFontColor: theme.colors.onSurface,
                  legendFontSize: 12,
                }))}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
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