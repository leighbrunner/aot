import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

export interface UsageMetricsData {
  activeUsers: {
    current: number;
    limit: number;
  };
  storage: {
    used: number;
    total: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    resetDate: string;
  };
  bandwidth: {
    used: number;
    total: number;
  };
}

interface UsageMetricsProps {
  data: UsageMetricsData;
}

export default function UsageMetrics({ data }: UsageMetricsProps) {
  const theme = useTheme();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return theme.colors.success;
    if (percentage < 80) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderMetric = (
    title: string,
    current: number,
    total: number,
    icon: string,
    format: 'number' | 'bytes' = 'number',
    subtitle?: string
  ) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    const progressColor = getProgressColor(percentage);

    return (
      <Surface style={styles.metricCard} elevation={2}>
        <View style={styles.metricHeader}>
          <View style={[styles.iconContainer, { backgroundColor: progressColor + '20' }]}>
            <MaterialCommunityIcons
              name={icon as any}
              size={24}
              color={progressColor}
            />
          </View>
          <View style={styles.metricInfo}>
            <Text variant="titleMedium">{title}</Text>
            <Text variant="bodyMedium" style={styles.metricValue}>
              {format === 'bytes' 
                ? `${formatBytes(current)} / ${formatBytes(total)}`
                : `${current.toLocaleString()} / ${total.toLocaleString()}`
              }
            </Text>
            {subtitle && (
              <Text variant="labelSmall" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          <Text variant="titleLarge" style={[styles.percentage, { color: progressColor }]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
        <ProgressBar
          progress={percentage / 100}
          color={progressColor}
          style={styles.progressBar}
        />
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Usage Metrics
      </Text>
      
      {renderMetric(
        'Active Users',
        data.activeUsers.current,
        data.activeUsers.limit,
        'account-multiple'
      )}
      
      {renderMetric(
        'Storage',
        data.storage.used,
        data.storage.total,
        'database',
        'bytes'
      )}
      
      {renderMetric(
        'API Calls',
        data.apiCalls.used,
        data.apiCalls.limit,
        'api',
        'number',
        `Resets on ${data.apiCalls.resetDate}`
      )}
      
      {renderMetric(
        'Bandwidth',
        data.bandwidth.used,
        data.bandwidth.total,
        'cloud-download',
        'bytes'
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    opacity: 0.8,
    marginTop: 2,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  percentage: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});