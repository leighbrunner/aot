import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Surface,
  IconButton,
  Divider,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVotingStore } from '../../store/voting.store';
import { voteQueueService } from '../../services/voting/voteQueue';

interface NotificationCenterProps {
  visible: boolean;
  onDismiss: () => void;
}

interface Notification {
  id: string;
  type: 'queued_vote' | 'achievement' | 'trending' | 'milestone';
  title: string;
  message: string;
  timestamp: string;
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function NotificationCenter({ visible, onDismiss }: NotificationCenterProps) {
  const theme = useTheme();
  const { queueSize, pendingVotes } = useVotingStore();
  const [processing, setProcessing] = useState(false);

  // Generate notifications from app state
  const notifications: Notification[] = [];

  // Queued votes notification
  if (queueSize > 0) {
    notifications.push({
      id: 'queued-votes',
      type: 'queued_vote',
      title: `${queueSize} Votes Pending`,
      message: 'Your votes will be submitted when connection is restored',
      timestamp: new Date().toISOString(),
      icon: 'cloud-upload',
      actionLabel: 'Retry Now',
      onAction: async () => {
        setProcessing(true);
        try {
          await voteQueueService.processQueue();
        } finally {
          setProcessing(false);
        }
      },
    });
  }

  // Add mock notifications for demo
  if (notifications.length === 0) {
    notifications.push(
      {
        id: 'achievement-1',
        type: 'achievement',
        title: 'Week Warrior Unlocked!',
        message: 'You voted every day this week',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        icon: 'trophy',
      },
      {
        id: 'trending-1',
        type: 'trending',
        title: 'New #1 Image',
        message: 'The leaderboard has a new champion',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        icon: 'trending-up',
      }
    );
  }

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'queued_vote': return theme.colors.warning;
      case 'achievement': return theme.colors.primary;
      case 'trending': return theme.colors.error;
      case 'milestone': return theme.colors.success;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getRelativeTime = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={item.onAction}
      disabled={!item.onAction || processing}
      activeOpacity={item.onAction ? 0.7 : 1}
    >
      <View style={styles.notificationItem}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={24}
            color={getIconColor(item.type)}
          />
        </View>
        
        <View style={styles.notificationContent}>
          <Text variant="titleSmall">{item.title}</Text>
          <Text variant="bodySmall" style={styles.message}>
            {item.message}
          </Text>
          <Text variant="labelSmall" style={styles.timestamp}>
            {getRelativeTime(item.timestamp)}
          </Text>
        </View>
        
        {item.actionLabel && (
          <Button
            mode="text"
            onPress={item.onAction}
            loading={processing}
            disabled={processing}
            compact
          >
            {item.actionLabel}
          </Button>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <Surface style={styles.container} elevation={0}>
          <View style={styles.header}>
            <Text variant="headlineSmall">Notifications</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
          </View>
          
          <Divider />
          
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No new notifications
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <Divider style={styles.divider} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    maxHeight: '80%',
  },
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  message: {
    opacity: 0.7,
  },
  timestamp: {
    opacity: 0.5,
    marginTop: 2,
  },
  divider: {
    marginHorizontal: 16,
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    opacity: 0.7,
  },
});