import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const LeaderboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Leaderboard Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});