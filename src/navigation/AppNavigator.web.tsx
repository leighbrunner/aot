import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { VotingScreen } from '@/screens/VotingScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

export type RootTabParamList = {
  Voting: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Web-specific navigator without native dependencies
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Voting"
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: 'gray',
          // Disable native optimizations for web
          detachInactiveScreens: false,
          freezeOnBlur: false,
        }}
      >
        <Tab.Screen 
          name="Voting" 
          component={VotingScreen}
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
          component={ProfileScreen}
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};