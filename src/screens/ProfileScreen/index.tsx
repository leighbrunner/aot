import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Title,
  Paragraph,
  List,
  Divider,
  Text,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/navigation/ProfileNavigator';
import { useAuth } from '@/contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';
import { getUser } from '@/graphql/queries';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, signOut, isAnonymous } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalVotes: 0,
    currentStreak: 0,
    longestStreak: 0,
    preferenceScore: 0.5,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const response = await client.graphql({
        query: getUser,
        variables: { userId: user.userId },
      });

      const userData = response.data.getUser;
      if (userData) {
        setProfile(userData);
        
        if (userData.stats) {
          const userStats = JSON.parse(userData.stats);
          setStats({
            totalVotes: userStats.totalVotes || 0,
            currentStreak: userStats.currentStreak || 0,
            longestStreak: userStats.longestStreak || 0,
            preferenceScore: userStats.preferenceScore || 0.5,
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getPreferenceLabel = () => {
    if (stats.preferenceScore > 0.6) return 'Team Ass 🍑';
    if (stats.preferenceScore < 0.4) return 'Team Tits 🍈';
    return 'Undecided 🤔';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Avatar.Icon
              size={80}
              icon="account"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.headerInfo}>
              <Title>{profile?.username || 'Anonymous User'}</Title>
              <Paragraph>{profile?.email || 'No email set'}</Paragraph>
              <Text style={[styles.preferenceText, { color: theme.colors.primary }]}>
                {getPreferenceLabel()}
              </Text>
            </View>
            <IconButton
              icon="pencil"
              size={24}
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.editButton}
            />
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>Your Statistics</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalVotes}</Text>
                <Text style={styles.statLabel}>Total Votes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.longestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Convert Account Card for Anonymous Users */}
        {isAnonymous && (
          <Card style={[styles.convertCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Card.Content style={styles.convertContent}>
              <MaterialCommunityIcons
                name="account-convert"
                size={32}
                color={theme.colors.primary}
                style={styles.convertIcon}
              />
              <View style={styles.convertTextContainer}>
                <Text style={[styles.convertTitle, { color: theme.colors.onPrimaryContainer }]}>
                  Secure Your Account
                </Text>
                <Text style={[styles.convertDescription, { color: theme.colors.onPrimaryContainer }]}>
                  Convert to a full account to save your progress
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('ConvertAccount')}
                style={styles.convertButton}
                labelStyle={styles.convertButtonLabel}
              >
                Convert
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <List.Section>
            <List.Item
              title="Edit Profile"
              description="Update your username and preferences"
              left={props => <List.Icon {...props} icon="account-edit" />}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <Divider />
            <List.Item
              title="Privacy Settings"
              description="Manage your privacy preferences"
              left={props => <List.Icon {...props} icon="shield-account" />}
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon')}
            />
            <Divider />
            <List.Item
              title="About"
              description="Learn more about the app"
              left={props => <List.Icon {...props} icon="information" />}
              onPress={() => Alert.alert('About', 'Voting App v1.0.0')}
            />
          </List.Section>
        </Card>

        {/* Sign Out Button */}
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  preferenceText: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  actionsCard: {
    marginBottom: 24,
  },
  signOutButton: {
    borderColor: '#f44336',
  },
  convertCard: {
    marginBottom: 16,
    elevation: 2,
  },
  convertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  convertIcon: {
    marginRight: 12,
  },
  convertTextContainer: {
    flex: 1,
  },
  convertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  convertDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  convertButton: {
    marginLeft: 12,
  },
  convertButtonLabel: {
    fontSize: 14,
  },
});