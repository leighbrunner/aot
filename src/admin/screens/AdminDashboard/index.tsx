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
  IconButton,
  Card,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { adminAPI, type AdminStats } from '../../services/adminAPI';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export default function AdminDashboard() {
  const navigation = useNavigation();
  const theme = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const adminStats = await adminAPI.getAdminStats();
      setStats(adminStats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats(true);
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    trend?: number
  ) => (
    <Surface style={styles.statCard} elevation={2}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={24}
          color={color}
        />
      </View>
      <Text variant="titleLarge" style={styles.statValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text variant="bodyMedium" style={styles.statLabel}>
        {title}
      </Text>
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <MaterialCommunityIcons
            name={trend > 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={trend > 0 ? theme.colors.success : theme.colors.error}
          />
          <Text
            variant="labelSmall"
            style={[
              styles.trendText,
              { color: trend > 0 ? theme.colors.success : theme.colors.error }
            ]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </Surface>
  );

  const renderQuickAction = (
    title: string,
    icon: string,
    onPress: () => void,
    badge?: number
  ) => (
    <Card mode="elevated" style={styles.quickAction} onPress={onPress}>
      <Card.Content style={styles.quickActionContent}>
        <View style={styles.quickActionIcon}>
          <MaterialCommunityIcons
            name={icon as any}
            size={32}
            color={theme.colors.primary}
          />
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text variant="labelSmall" style={styles.badgeText}>
                {badge}
              </Text>
            </View>
          )}
        </View>
        <Text variant="titleMedium" style={styles.quickActionTitle}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </AdminRoute>
    );
  }

  if (error) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="titleMedium" style={styles.errorText}>
            {error}
          </Text>
          <IconButton
            icon="refresh"
            size={24}
            onPress={() => loadStats()}
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
          <View>
            <Text variant="headlineMedium">Admin Dashboard</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => console.log('Settings')}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Users',
            stats?.totalUsers || 0,
            'account-multiple',
            theme.colors.primary,
            12
          )}
          {renderStatCard(
            'Active Today',
            stats?.activeUsers24h || 0,
            'account-check',
            theme.colors.success
          )}
          {renderStatCard(
            'Total Votes',
            stats?.totalVotes || 0,
            'vote',
            theme.colors.secondary,
            8
          )}
          {renderStatCard(
            'Votes Today',
            stats?.votesToday || 0,
            'trending-up',
            theme.colors.tertiary
          )}
          {renderStatCard(
            'Total Images',
            stats?.totalImages || 0,
            'image-multiple',
            theme.colors.primary
          )}
          {renderStatCard(
            'Pending Review',
            stats?.pendingImages || 0,
            'clock-alert',
            theme.colors.warning
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction(
              'Review Images',
              'image-check',
              () => console.log('Review images'),
              stats?.pendingImages
            )}
            {renderQuickAction(
              'Generate Content',
              'creation',
              () => console.log('Generate content')
            )}
            {renderQuickAction(
              'Manage Categories',
              'shape-plus',
              () => console.log('Manage categories')
            )}
            {renderQuickAction(
              'View Analytics',
              'chart-line',
              () => navigation.navigate('AnalyticsOverview' as never)
            )}
            {renderQuickAction(
              'User Management',
              'account-cog',
              () => console.log('User management')
            )}
            {renderQuickAction(
              'Activity Log',
              'history',
              () => console.log('Activity log')
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <Surface style={styles.activityCard} elevation={1}>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={theme.colors.success}
              />
              <Text variant="bodyMedium" style={styles.activityText}>
                5 images approved
              </Text>
              <Text variant="labelSmall" style={styles.activityTime}>
                10 minutes ago
              </Text>
            </View>
            <Divider />
            <View style={styles.activityItem}>
              <MaterialCommunityIcons
                name="creation"
                size={20}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" style={styles.activityText}>
                AI generation completed
              </Text>
              <Text variant="labelSmall" style={styles.activityTime}>
                1 hour ago
              </Text>
            </View>
            <Divider />
            <View style={styles.activityItem}>
              <MaterialCommunityIcons
                name="account-plus"
                size={20}
                color={theme.colors.secondary}
              />
              <Text variant="bodyMedium" style={styles.activityText}>
                25 new users joined
              </Text>
              <Text variant="labelSmall" style={styles.activityTime}>
                Today
              </Text>
            </View>
          </Surface>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 3,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.7,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendText: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: (screenWidth - 56) / 2,
    marginBottom: 4,
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  quickActionIcon: {
    position: 'relative',
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  quickActionTitle: {
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTime: {
    opacity: 0.6,
  },
});