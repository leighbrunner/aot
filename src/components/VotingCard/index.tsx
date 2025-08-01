import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VotingCardProps {
  imageUrl: string;
  onVote: () => void;
}

export const VotingCard: React.FC<VotingCardProps> = ({ imageUrl, onVote }) => {
  return (
    <View style={styles.container}>
      <Text>VotingCard Component</Text>
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