import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { realtimeService } from '../../services/realtime/realtimeService';

interface ActiveUsersIndicatorProps {
  compact?: boolean;
}

export default function ActiveUsersIndicator({ compact = false }: ActiveUsersIndicatorProps) {
  const theme = useTheme();
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentCountries, setRecentCountries] = useState<string[]>([]);

  useEffect(() => {
    // Get initial active users count
    realtimeService.getLatestStats().then(stats => {
      const activeUsersUpdate = stats.find(s => s.type === 'activeUsers');
      if (activeUsersUpdate && activeUsersUpdate.value) {
        const data = JSON.parse(activeUsersUpdate.value as string);
        setActiveUsers(data.count);
        if (data.countries) {
          setRecentCountries(data.countries.slice(0, 3));
        }
      }
    }).catch(console.error);

    // Subscribe to updates
    const subscription = realtimeService.subscribeToStatsUpdates(
      (update) => {
        if (update.type === 'activeUsers' && update.value) {
          const data = JSON.parse(update.value as string);
          setActiveUsers(data.count);
          if (data.countries) {
            setRecentCountries(data.countries.slice(0, 3));
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />
        <Text variant="labelSmall">{activeUsers} active</Text>
      </View>
    );
  }

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />
        <Text variant="titleSmall">Active Now</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userCount}>
          <MaterialCommunityIcons
            name="account-multiple"
            size={32}
            color={theme.colors.primary}
          />
          <Text variant="headlineMedium" style={styles.count}>
            {activeUsers}
          </Text>
        </View>

        {recentCountries.length > 0 && (
          <View style={styles.countries}>
            <Text variant="labelSmall" style={styles.countriesLabel}>
              Voting from:
            </Text>
            <View style={styles.countryList}>
              {recentCountries.map((country, index) => (
                <View key={index} style={styles.countryItem}>
                  <Text variant="labelSmall">{getFlagEmoji(country)}</Text>
                  <Text variant="labelSmall">{country}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Surface>
  );
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    gap: 16,
  },
  userCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  count: {
    fontWeight: 'bold',
  },
  countries: {
    gap: 8,
  },
  countriesLabel: {
    opacity: 0.7,
  },
  countryList: {
    flexDirection: 'row',
    gap: 12,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});