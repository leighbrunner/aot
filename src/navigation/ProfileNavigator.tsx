import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { ConvertAccountScreen } from '@/screens/ConvertAccountScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ConvertAccount: undefined;
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
      <Stack.Screen 
        name="ConvertAccount" 
        component={ConvertAccountScreen}
        options={{
          headerShown: true,
          title: 'Convert Account',
        }}
      />
    </Stack.Navigator>
  );
};