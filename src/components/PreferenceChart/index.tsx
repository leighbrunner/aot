import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

interface PreferenceChartProps {
  breakdown: Record<string, number>;
}

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 64;
const CHART_HEIGHT = 200;
const BAR_WIDTH = 60;

export default function PreferenceChart({ breakdown }: PreferenceChartProps) {
  const theme = useTheme();
  
  const categories = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  const maxValue = Math.max(...Object.values(breakdown), 1);
  
  const getBarColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ass': return theme.colors.primary;
      case 'tits': return theme.colors.secondary;
      default: return theme.colors.tertiary;
    }
  };
  
  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {categories.map(([category, value], index) => {
          const barHeight = (value / 100) * (CHART_HEIGHT - 40);
          const x = index * (BAR_WIDTH + 20) + 20;
          const y = CHART_HEIGHT - barHeight - 20;
          
          return (
            <React.Fragment key={category}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                fill={getBarColor(category)}
                rx={4}
                ry={4}
              />
              
              {/* Value label */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={y - 10}
                fill={theme.colors.onSurface}
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {value}%
              </SvgText>
              
              {/* Category label */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - 5}
                fill={theme.colors.onSurfaceVariant}
                fontSize="12"
                textAnchor="middle"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text variant="labelSmall" style={styles.legendText}>
          Your voting distribution across categories
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 16,
  },
  legend: {
    marginTop: 16,
  },
  legendText: {
    opacity: 0.7,
    textAlign: 'center',
  },
});