import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { VotingCard } from '@/components/VotingCard';

export const VotingScreen: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
        Vote Now
      </Text>
      <VotingCard imageUrl="" onVote={() => {}} />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});