import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

export default function StatsCard({ icon, label, value, color }: StatsCardProps) {
  const theme = useTheme();
  const iconColor = color || theme.colors.primary;

  return (
    <Surface style={styles.card} elevation={1}>
      <MaterialCommunityIcons
        name={icon as any}
        size={28}
        color={iconColor}
        style={styles.icon}
      />
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.value}>
        {value}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
  },
});