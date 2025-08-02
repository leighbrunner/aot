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
  FAB,
  Portal,
  Dialog,
  Button,
  Chip,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import UsageMetrics, { type UsageMetricsData } from '../../components/UsageMetrics';
import PerformanceMonitor, { type PerformanceData } from '../../components/PerformanceMonitor';
import { adminAPI } from '../../services/adminAPI';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Mock data - in production this would come from the API
  const [usageData] = useState<UsageMetricsData>({
    activeUsers: {
      current: 3421,
      limit: 10000,
    },
    storage: {
      used: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
      total: 10 * 1024 * 1024 * 1024, // 10 GB
    },
    apiCalls: {
      used: 145000,
      limit: 1000000,
      resetDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM d, yyyy'),
    },
    bandwidth: {
      used: 45 * 1024 * 1024 * 1024, // 45 GB
      total: 100 * 1024 * 1024 * 1024, // 100 GB
    },
  });

  const [performanceData] = useState<PerformanceData>({
    apiLatency: {
      p50: 45,
      p95: 156,
      p99: 312,
    },
    errorRate: {
      percentage: 0.08,
      count: 116,
      total: 145000,
    },
    uptime: {
      percentage: 99.95,
      lastDowntime: '2 weeks ago',
    },
    lambdaMetrics: {
      avgDuration: 78,
      maxDuration: 1250,
      coldStarts: 234,
      invocations: 145000,
    },
    dbMetrics: {
      readLatency: 12,
      writeLatency: 25,
      throttles: 0,
    },
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const exportData = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      const fileName = `analytics-export-${timestamp}.${format}`;
      const fileUri = FileSystem.documentDirectory + fileName;

      let content = '';
      
      if (format === 'json') {
        content = JSON.stringify({
          exportDate: new Date().toISOString(),
          usage: usageData,
          performance: performanceData,
        }, null, 2);
      } else {
        // CSV format
        content = 'Analytics Export\n';
        content += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        content += 'Usage Metrics\n';
        content += 'Metric,Current,Limit,Percentage\n';
        content += `Active Users,${usageData.activeUsers.current},${usageData.activeUsers.limit},${((usageData.activeUsers.current / usageData.activeUsers.limit) * 100).toFixed(1)}%\n`;
        content += `Storage (GB),${(usageData.storage.used / (1024 * 1024 * 1024)).toFixed(2)},${(usageData.storage.total / (1024 * 1024 * 1024)).toFixed(2)},${((usageData.storage.used / usageData.storage.total) * 100).toFixed(1)}%\n`;
        content += `API Calls,${usageData.apiCalls.used},${usageData.apiCalls.limit},${((usageData.apiCalls.used / usageData.apiCalls.limit) * 100).toFixed(1)}%\n`;
        content += `Bandwidth (GB),${(usageData.bandwidth.used / (1024 * 1024 * 1024)).toFixed(2)},${(usageData.bandwidth.total / (1024 * 1024 * 1024)).toFixed(2)},${((usageData.bandwidth.used / usageData.bandwidth.total) * 100).toFixed(1)}%\n`;
        
        content += '\nPerformance Metrics\n';
        content += 'Metric,Value\n';
        content += `API Latency P50,${performanceData.apiLatency.p50}ms\n`;
        content += `API Latency P95,${performanceData.apiLatency.p95}ms\n`;
        content += `API Latency P99,${performanceData.apiLatency.p99}ms\n`;
        content += `Error Rate,${performanceData.errorRate.percentage}%\n`;
        content += `Uptime,${performanceData.uptime.percentage}%\n`;
        content += `Lambda Avg Duration,${performanceData.lambdaMetrics.avgDuration}ms\n`;
        content += `Lambda Cold Starts,${performanceData.lambdaMetrics.coldStarts}\n`;
        content += `DB Read Latency,${performanceData.dbMetrics.readLatency}ms\n`;
        content += `DB Write Latency,${performanceData.dbMetrics.writeLatency}ms\n`;
      }

      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'json' ? 'application/json' : 'text/csv',
        dialogTitle: 'Export Analytics Data',
      });
      
      setExportDialogVisible(false);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setExporting(false);
    }
  };

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
            <Text variant="headlineMedium">Analytics Dashboard</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              System performance and usage metrics
            </Text>
          </View>
          <IconButton
            icon="download"
            size={24}
            onPress={() => setExportDialogVisible(true)}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Surface style={styles.quickStatCard} elevation={1}>
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={theme.colors.success}
            />
            <Text variant="titleMedium" style={styles.quickStatValue}>
              All Systems Operational
            </Text>
          </Surface>
        </View>

        {/* Usage Metrics */}
        <UsageMetrics data={usageData} />

        {/* Performance Monitor */}
        <PerformanceMonitor data={performanceData} />

        {/* Export Dialog */}
        <Portal>
          <Dialog
            visible={exportDialogVisible}
            onDismiss={() => setExportDialogVisible(false)}
          >
            <Dialog.Title>Export Analytics Data</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Choose the format for your analytics export:
              </Text>
              <View style={styles.exportOptions}>
                <Chip
                  icon="code-json"
                  onPress={() => exportData('json')}
                  mode="outlined"
                  style={styles.exportChip}
                  disabled={exporting}
                >
                  JSON
                </Chip>
                <Chip
                  icon="file-excel"
                  onPress={() => exportData('csv')}
                  mode="outlined"
                  style={styles.exportChip}
                  disabled={exporting}
                >
                  CSV
                </Chip>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setExportDialogVisible(false)} disabled={exporting}>
                Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  quickStats: {
    padding: 16,
    paddingBottom: 0,
  },
  quickStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  quickStatValue: {
    flex: 1,
  },
  exportOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  exportChip: {
    flex: 1,
  },
});