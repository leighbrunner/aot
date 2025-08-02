import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Badge, IconButton, useTheme } from 'react-native-paper';
import { realtimeService } from '../../services/realtime/realtimeService';
import { useVotingStore } from '../../store/voting.store';

interface NotificationBadgeProps {
  onPress?: () => void;
}

export default function NotificationBadge({ onPress }: NotificationBadgeProps) {
  const theme = useTheme();
  const { queueSize } = useVotingStore();
  const [notificationCount, setNotificationCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasNewNotifications = notificationCount > 0 || queueSize > 0;

  useEffect(() => {
    // Subscribe to real-time notifications
    const subscription = realtimeService.subscribeToStatsUpdates(
      (update) => {
        // Handle different notification types
        if (update.type === 'topImage' && update.value) {
          // New top image notification
          setNotificationCount(prev => prev + 1);
          animatePulse();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Pulse when queue size changes
    if (queueSize > 0) {
      animatePulse();
    }
  }, [queueSize]);

  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    setNotificationCount(0);
    onPress?.();
  };

  const totalCount = notificationCount + queueSize;

  return (
    <View style={styles.container}>
      <IconButton
        icon="bell"
        size={24}
        onPress={handlePress}
        style={[
          styles.iconButton,
          hasNewNotifications && { backgroundColor: theme.colors.primaryContainer }
        ]}
      />
      {hasNewNotifications && (
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Badge size={18} style={styles.badge}>
            {totalCount}
          </Badge>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconButton: {
    margin: 0,
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  badge: {
    backgroundColor: '#FF5252',
  },
});