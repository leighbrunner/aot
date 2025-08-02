import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface PerformanceData {
  apiLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: {
    percentage: number;
    count: number;
    total: number;
  };
  uptime: {
    percentage: number;
    lastDowntime?: string;
  };
  lambdaMetrics: {
    avgDuration: number;
    maxDuration: number;
    coldStarts: number;
    invocations: number;
  };
  dbMetrics: {
    readLatency: number;
    writeLatency: number;
    throttles: number;
  };
}

interface PerformanceMonitorProps {
  data: PerformanceData;
}

export default function PerformanceMonitor({ data }: PerformanceMonitorProps) {
  const theme = useTheme();

  const getStatusColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'latency':
        if (value < 200) return theme.colors.success;
        if (value < 500) return theme.colors.warning;
        return theme.colors.error;
      case 'error':
        if (value < 0.1) return theme.colors.success;
        if (value < 1) return theme.colors.warning;
        return theme.colors.error;
      case 'uptime':
        if (value >= 99.9) return theme.colors.success;
        if (value >= 99) return theme.colors.warning;
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const renderLatencyMetric = (label: string, value: number) => {
    const color = getStatusColor('latency', value);
    return (
      <View style={styles.latencyItem}>
        <Text variant="labelMedium" style={styles.latencyLabel}>
          {label}
        </Text>
        <Chip
          mode="flat"
          style={[styles.latencyChip, { backgroundColor: color + '20' }]}
          textStyle={{ color }}
        >
          {value}ms
        </Chip>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Performance Monitoring
      </Text>

      {/* API Latency */}
      <Surface style={styles.section} elevation={2}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="speedometer"
            size={24}
            color={theme.colors.primary}
          />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            API Latency
          </Text>
        </View>
        <View style={styles.latencyGrid}>
          {renderLatencyMetric('P50', data.apiLatency.p50)}
          {renderLatencyMetric('P95', data.apiLatency.p95)}
          {renderLatencyMetric('P99', data.apiLatency.p99)}
        </View>
      </Surface>

      {/* Error Rate */}
      <Surface style={styles.section} elevation={2}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={24}
            color={getStatusColor('error', data.errorRate.percentage)}
          />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Error Rate
          </Text>
        </View>
        <View style={styles.errorContent}>
          <Text
            variant="displaySmall"
            style={[
              styles.errorPercentage,
              { color: getStatusColor('error', data.errorRate.percentage) }
            ]}
          >
            {data.errorRate.percentage.toFixed(2)}%
          </Text>
          <Text variant="bodyMedium" style={styles.errorDetails}>
            {data.errorRate.count} errors out of {data.errorRate.total.toLocaleString()} requests
          </Text>
        </View>
      </Surface>

      {/* Uptime */}
      <Surface style={styles.section} elevation={2}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={getStatusColor('uptime', data.uptime.percentage)}
          />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Uptime
          </Text>
        </View>
        <View style={styles.uptimeContent}>
          <Text
            variant="displaySmall"
            style={[
              styles.uptimePercentage,
              { color: getStatusColor('uptime', data.uptime.percentage) }
            ]}
          >
            {data.uptime.percentage.toFixed(3)}%
          </Text>
          {data.uptime.lastDowntime && (
            <Text variant="labelSmall" style={styles.lastDowntime}>
              Last downtime: {data.uptime.lastDowntime}
            </Text>
          )}
        </View>
      </Surface>

      {/* Lambda Metrics */}
      <Surface style={styles.section} elevation={2}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="function-variant"
            size={24}
            color={theme.colors.primary}
          />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Lambda Functions
          </Text>
        </View>
        <List.Item
          title="Average Duration"
          description={`${data.lambdaMetrics.avgDuration}ms`}
          left={() => <List.Icon icon="timer" />}
        />
        <Divider />
        <List.Item
          title="Max Duration"
          description={`${data.lambdaMetrics.maxDuration}ms`}
          left={() => <List.Icon icon="timer-alert" />}
        />
        <Divider />
        <List.Item
          title="Cold Starts"
          description={`${data.lambdaMetrics.coldStarts} (${((data.lambdaMetrics.coldStarts / data.lambdaMetrics.invocations) * 100).toFixed(1)}%)`}
          left={() => <List.Icon icon="snowflake" />}
        />
        <Divider />
        <List.Item
          title="Total Invocations"
          description={data.lambdaMetrics.invocations.toLocaleString()}
          left={() => <List.Icon icon="counter" />}
        />
      </Surface>

      {/* Database Metrics */}
      <Surface style={styles.section} elevation={2}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="database"
            size={24}
            color={theme.colors.primary}
          />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Database Performance
          </Text>
        </View>
        <List.Item
          title="Read Latency"
          description={`${data.dbMetrics.readLatency}ms`}
          left={() => <List.Icon icon="database-search" />}
        />
        <Divider />
        <List.Item
          title="Write Latency"
          description={`${data.dbMetrics.writeLatency}ms`}
          left={() => <List.Icon icon="database-edit" />}
        />
        <Divider />
        <List.Item
          title="Throttled Requests"
          description={data.dbMetrics.throttles === 0 ? 'None' : `${data.dbMetrics.throttles} throttles`}
          left={() => (
            <List.Icon
              icon="alert"
              color={data.dbMetrics.throttles > 0 ? theme.colors.warning : theme.colors.success}
            />
          )}
        />
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    padding: 16,
    paddingBottom: 8,
  },
  section: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  latencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingTop: 0,
  },
  latencyItem: {
    alignItems: 'center',
    gap: 8,
  },
  latencyLabel: {
    opacity: 0.7,
  },
  latencyChip: {
    minWidth: 80,
  },
  errorContent: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  errorPercentage: {
    fontWeight: 'bold',
  },
  errorDetails: {
    opacity: 0.7,
    marginTop: 4,
  },
  uptimeContent: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  uptimePercentage: {
    fontWeight: 'bold',
  },
  lastDowntime: {
    opacity: 0.6,
    marginTop: 4,
  },
});