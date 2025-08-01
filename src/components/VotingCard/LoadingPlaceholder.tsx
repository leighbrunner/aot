import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  interpolate
} from 'react-native-reanimated'

export const LoadingPlaceholder: React.FC = () => {
  const theme = useTheme()
  const shimmer = useSharedValue(0)

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    )
  }, [])

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-350, 350]
    )
    return {
      transform: [{ translateX }],
    }
  })

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.imageContainer}>
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Animated.View 
            style={[
              styles.shimmer,
              shimmerStyle,
              {
                backgroundColor: theme.colors.surface,
              }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={[styles.titlePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Animated.View 
            style={[
              styles.shimmer,
              shimmerStyle,
              {
                backgroundColor: theme.colors.surface,
              }
            ]} 
          />
        </View>
        
        <View style={styles.categoriesContainer}>
          {[1, 2].map((i) => (
            <View 
              key={i} 
              style={[styles.categoryPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Animated.View 
                style={[
                  styles.shimmer,
                  shimmerStyle,
                  {
                    backgroundColor: theme.colors.surface,
                  }
                ]} 
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 0.75,
  },
  imagePlaceholder: {
    flex: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 16,
  },
  titlePlaceholder: {
    height: 24,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPlaceholder: {
    width: 60,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 350,
    opacity: 0.3,
  },
})