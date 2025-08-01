import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Surface, Text, useTheme, IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, { 
  FadeIn, 
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export const OfflineIndicator: React.FC = () => {
  const theme = useTheme()
  const { isOnline, pendingVotes, syncNow } = useOfflineSync()
  const pulseOpacity = useSharedValue(1)

  React.useEffect(() => {
    if (!isOnline) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1,
        true
      )
    }
  }, [isOnline])

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  if (isOnline && pendingVotes === 0) {
    return null
  }

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.container}
    >
      <Surface 
        style={[
          styles.surface,
          { backgroundColor: isOnline ? theme.colors.primaryContainer : theme.colors.errorContainer }
        ]}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, !isOnline && pulseStyle]}>
            <MaterialCommunityIcons
              name={isOnline ? 'cloud-sync' : 'cloud-off-outline'}
              size={20}
              color={isOnline ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer}
            />
          </Animated.View>
          
          <View style={styles.textContainer}>
            <Text 
              variant="labelMedium"
              style={{ color: isOnline ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer }}
            >
              {isOnline ? 'Syncing...' : 'Offline Mode'}
            </Text>
            {pendingVotes > 0 && (
              <Text 
                variant="labelSmall"
                style={{ 
                  color: isOnline ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer,
                  opacity: 0.8 
                }}
              >
                {pendingVotes} pending vote{pendingVotes > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {isOnline && pendingVotes > 0 && (
            <IconButton
              icon="refresh"
              size={16}
              onPress={syncNow}
              iconColor={theme.colors.onPrimaryContainer}
            />
          )}
        </View>
      </Surface>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  surface: {
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
})