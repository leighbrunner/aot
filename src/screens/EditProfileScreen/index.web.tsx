import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Avatar,
  Text,
  useTheme,
  Divider,
  RadioButton,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { updateUser } from '@/graphql/mutations';
import { getUser } from '@/graphql/queries';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export const EditProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const usernameRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [primaryPreference, setPrimaryPreference] = useState<'ass' | 'tits'>('ass');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [stats, setStats] = useState({
    totalVotes: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastVoteDate: '',
  });

  useEffect(() => {
    loadUserProfile();
    // Auto-focus username field on web
    setTimeout(() => {
      usernameRef.current?.focus();
    }, 100);
  }, []);

  const loadUserProfile = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const response = await client.graphql({
        query: getUser,
        variables: { userId: user.userId },
      });

      const userData = response.data.getUser;
      if (userData) {
        setUsername(userData.username || '');
        setEmail(userData.email || '');
        setIsAnonymous(userData.isAnonymous || false);
        
        if (userData.preferences) {
          const prefs = JSON.parse(userData.preferences);
          setPrimaryPreference(prefs.primaryPreference || 'ass');
        }
        
        if (userData.stats) {
          setStats(JSON.parse(userData.stats));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) return;
    
    setSaving(true);
    try {
      const preferences = JSON.stringify({
        primaryPreference,
        preferenceScore: primaryPreference === 'ass' ? 0.8 : 0.2,
      });

      await client.graphql({
        query: updateUser,
        variables: {
          input: {
            id: user.userId,
            username: username.trim(),
            email: email.trim(),
            preferences,
          },
        },
      });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !saving) {
      handleSave();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Title style={styles.headerTitle}>Edit Profile</Title>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer}>
              <Avatar.Icon
                size={120}
                icon="account"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.editIconContainer}>
                <MaterialCommunityIcons name="camera" size={24} color="white" />
              </View>
            </TouchableOpacity>
            {isAnonymous && (
              <Text style={[styles.anonymousText, { color: theme.colors.onSurfaceVariant }]}>
                Anonymous User
              </Text>
            )}
          </View>

          {/* Profile Information */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Profile Information</Title>
              
              <TextInput
                ref={usernameRef}
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                disabled={saving}
                onKeyPress={handleKeyPress}
                autoFocus
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={saving || !isAnonymous}
                onKeyPress={handleKeyPress}
              />
            </Card.Content>
          </Card>

          {/* Preferences */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Preferences</Title>
              <Paragraph style={styles.preferenceDescription}>
                What's your primary preference?
              </Paragraph>
              
              <RadioButton.Group
                onValueChange={(value) => setPrimaryPreference(value as 'ass' | 'tits')}
                value={primaryPreference}
              >
                <View style={styles.radioItem}>
                  <RadioButton.Item
                    label="Team Ass 🍑"
                    value="ass"
                    disabled={saving}
                  />
                </View>
                <View style={styles.radioItem}>
                  <RadioButton.Item
                    label="Team Tits 🍈"
                    value="tits"
                    disabled={saving}
                  />
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Statistics */}
          <Card style={styles.card}>
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

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Save Changes
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={saving}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  anonymousText: {
    marginTop: 12,
    fontSize: 16,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    marginTop: 16,
  },
  preferenceDescription: {
    marginTop: 4,
    marginBottom: 12,
    opacity: 0.7,
    fontSize: 16,
  },
  radioItem: {
    marginVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    flex: 1,
    maxWidth: 200,
  },
  cancelButton: {
    flex: 1,
    maxWidth: 200,
  },
});