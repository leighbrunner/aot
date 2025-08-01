import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut
} from 'react-native-reanimated'

interface SwipeIndicatorProps {
  visible: boolean
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ visible }) => {
  const theme = useTheme()
  const leftHandX = useSharedValue(0)
  const rightHandX = useSharedValue(0)
  const opacity = useSharedValue(0.7)

  React.useEffect(() => {
    if (visible) {
      // Animate left hand
      leftHandX.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )

      // Animate right hand with delay
      rightHandX.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(20, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        )
      )

      // Pulse opacity
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1
      )
    }
  }, [visible])

  const leftHandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftHandX.value }],
  }))

  const rightHandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightHandX.value }],
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  if (!visible) return null

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, containerStyle]}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.indicator, leftHandStyle]}>
          <MaterialCommunityIcons 
            name="gesture-swipe-left" 
            size={32} 
            color={theme.colors.primary}
          />
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.primary }]}>
            Pass
          </Text>
        </Animated.View>

        <Text variant="bodySmall" style={[styles.orText, { color: theme.colors.onSurfaceVariant }]}>
          Swipe or Tap
        </Text>

        <Animated.View style={[styles.indicator, rightHandStyle]}>
          <MaterialCommunityIcons 
            name="gesture-swipe-right" 
            size={32} 
            color={theme.colors.secondary}
          />
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.secondary }]}>
            Vote
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  indicator: {
    alignItems: 'center',
  },
  label: {
    marginTop: 4,
  },
  orText: {
    marginHorizontal: 16,
  },
})