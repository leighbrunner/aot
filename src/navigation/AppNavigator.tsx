import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { VotingScreen } from '@/screens/VotingScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { ProfileNavigator } from './ProfileNavigator';
import VotingErrorBoundary from '@/components/VotingErrorBoundary';

export type RootTabParamList = {
  Voting: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Wrapped VotingScreen with error boundary
const VotingScreenWithErrorBoundary: React.FC = () => (
  <VotingErrorBoundary>
    <VotingScreen />
  </VotingErrorBoundary>
);

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
        initialRouteName="Voting"
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="Voting" 
          component={VotingScreenWithErrorBoundary}
          options={{
            title: 'Vote',
            tabBarLabel: 'Vote',
          }}
        />
        <Tab.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen}
          options={{
            title: 'Leaderboard',
            tabBarLabel: 'Top Rated',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileNavigator}
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
  );
};