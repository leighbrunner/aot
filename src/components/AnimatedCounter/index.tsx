import React from 'react'
import { TextStyle } from 'react-native'
import { Text } from 'react-native-paper'
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming,
  Easing,
  runOnJS
} from 'react-native-reanimated'

const AnimatedText = Animated.createAnimatedComponent(Text)

interface AnimatedCounterProps {
  value: number
  duration?: number
  style?: TextStyle
  variant?: 'displayLarge' | 'displayMedium' | 'displaySmall' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' | 'titleLarge' | 'titleMedium' | 'titleSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'labelLarge' | 'labelMedium' | 'labelSmall'
  suffix?: string
  prefix?: string
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  variant = 'headlineMedium',
  suffix = '',
  prefix = '',
}) => {
  const animatedValue = useSharedValue(0)
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.exp),
    }, () => {
      runOnJS(setDisplayValue)(value)
    })
  }, [value])

  const animatedProps = useAnimatedProps(() => {
    const currentValue = Math.round(animatedValue.value)
    runOnJS(setDisplayValue)(currentValue)
    return {}
  })

  return (
    <AnimatedText
      variant={variant}
      style={style}
      animatedProps={animatedProps}
    >
      {prefix}{displayValue.toLocaleString()}{suffix}
    </AnimatedText>
  )
}