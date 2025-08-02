import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
import { getCurrentUser, updateUser } from '@/graphql/mutations';
import { getUser } from '@/graphql/queries';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export const EditProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Avatar.Icon
              size={100}
              icon="account"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.editIconContainer}>
              <MaterialCommunityIcons name="camera" size={20} color="white" />
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
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              disabled={saving}
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
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Votes:</Text>
              <Text style={styles.statValue}>{stats.totalVotes}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current Streak:</Text>
              <Text style={styles.statValue}>{stats.currentStreak} days</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Longest Streak:</Text>
              <Text style={styles.statValue}>{stats.longestStreak} days</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Save Changes
        </Button>

        {/* Cancel Button */}
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  anonymousText: {
    marginTop: 8,
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginTop: 12,
  },
  preferenceDescription: {
    marginTop: 4,
    marginBottom: 8,
    opacity: 0.7,
  },
  radioItem: {
    marginVertical: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 4,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 4,
  },
  cancelButton: {
    marginTop: 8,
  },
});