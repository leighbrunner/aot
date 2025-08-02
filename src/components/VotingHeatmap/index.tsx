import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';

interface VotingHeatmapProps {
  data: Record<string, number>;
}

export default function VotingHeatmap({ data }: VotingHeatmapProps) {
  const theme = useTheme();
  
  // Get the last 30 days
  const last30Days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last30Days.push(date.toISOString().split('T')[0]);
  }
  
  // Get max votes for color scaling
  const maxVotes = Math.max(...Object.values(data), 1);
  
  const getColorIntensity = (votes: number) => {
    if (votes === 0) return theme.colors.surfaceVariant;
    const intensity = votes / maxVotes;
    if (intensity > 0.8) return theme.colors.primary;
    if (intensity > 0.6) return theme.colors.primaryContainer;
    if (intensity > 0.4) return theme.colors.secondaryContainer;
    if (intensity > 0.2) return theme.colors.tertiaryContainer;
    return theme.colors.surfaceVariant;
  };
  
  // Group by weeks
  const weeks = [];
  for (let i = 0; i < last30Days.length; i += 7) {
    weeks.push(last30Days.slice(i, i + 7));
  }
  
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.title}>
        Last 30 Days Activity
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Day labels */}
          <View style={styles.dayLabelsContainer}>
            {dayLabels.map((day, index) => (
              <Text key={index} variant="labelSmall" style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>
          
          {/* Heatmap grid */}
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((date, dayIndex) => {
                  const votes = data[date] || 0;
                  return (
                    <Surface
                      key={date}
                      style={[
                        styles.day,
                        { backgroundColor: getColorIntensity(votes) }
                      ]}
                      elevation={votes > 0 ? 1 : 0}
                    >
                      <Text variant="labelSmall" style={styles.dayText}>
                        {votes || ''}
                      </Text>
                    </Surface>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text variant="labelSmall" style={styles.legendLabel}>Less</Text>
        <View style={styles.legendColors}>
          {[0, 0.2, 0.4, 0.6, 0.8].map((intensity, index) => (
            <Surface
              key={index}
              style={[
                styles.legendColor,
                { backgroundColor: getColorIntensity(intensity * maxVotes) }
              ]}
              elevation={0}
            />
          ))}
        </View>
        <Text variant="labelSmall" style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    marginBottom: 12,
    opacity: 0.7,
  },
  dayLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    marginHorizontal: 2,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
  },
  week: {
    marginHorizontal: 2,
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 10,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    opacity: 0.7,
  },
});