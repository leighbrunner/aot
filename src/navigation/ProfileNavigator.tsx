import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'Edit Profile',
        }}
      />
    </Stack.Navigator>
  );
};