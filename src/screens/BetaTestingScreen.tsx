import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  List,
  Divider,
  Chip,
  Portal,
  Dialog,
  RadioButton,
  Surface,
  IconButton,
  Banner,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { betaTesting, BetaUpdate, BetaFeedback } from '@/services/beta/betaTesting';
import { useAuth } from '@/contexts/AuthContext';
import { errorTracker } from '@/services/monitoring/errorTracking';
import { useTheme } from '@/hooks/useTheme';

export function BetaTestingScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [betaStats, setBetaStats] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState<BetaUpdate | null>(null);
  const [feedbackDialogVisible, setFeedbackDialogVisible] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'performance' | 'ui' | 'other'>('bug');
  const [feedbackSeverity, setFeedbackSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackSteps, setFeedbackSteps] = useState('');

  useEffect(() => {
    loadBetaStatus();
  }, []);

  const loadBetaStatus = async () => {
    try {
      setIsLoading(true);
      const status = await betaTesting.checkBetaStatus(user?.id || '');
      setIsBetaTester(status);

      if (status) {
        const stats = await betaTesting.getBetaStats();
        setBetaStats(stats);
        
        const update = await betaTesting.checkForUpdates();
        setUpdateAvailable(update);
      }
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'load_beta_status',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollBeta = async () => {
    try {
      setEnrolling(true);
      const enrolled = await betaTesting.enrollInBeta(
        user?.id || '',
        inviteCode || undefined
      );

      if (enrolled) {
        setIsBetaTester(true);
        await loadBetaStatus();
        Alert.alert(
          'Welcome to Beta!',
          'You\'re now part of the beta testing program. You\'ll receive early access to new features and updates.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Enrollment Failed',
          'Invalid invite code or enrollment error. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll in beta program');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLeaveBeta = async () => {
    Alert.alert(
      'Leave Beta Program',
      'Are you sure you want to leave the beta program? You\'ll lose access to beta features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await betaTesting.leaveBeta(user?.id || '', 'User requested');
              setIsBetaTester(false);
              Alert.alert('Beta Program', 'You\'ve left the beta program');
            } catch (error) {
              Alert.alert('Error', 'Failed to leave beta program');
            }
          },
        },
      ]
    );
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackTitle || !feedbackDescription) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      await betaTesting.submitFeedback({
        userId: user?.id || '',
        type: feedbackType,
        severity: feedbackSeverity,
        title: feedbackTitle,
        description: feedbackDescription,
        steps: feedbackSteps || undefined,
        deviceInfo: {},
        appState: {},
        status: 'pending',
      });

      Alert.alert('Feedback Submitted', 'Thank you for your feedback!');
      setFeedbackDialogVisible(false);
      
      // Reset form
      setFeedbackTitle('');
      setFeedbackDescription('');
      setFeedbackSteps('');
      setFeedbackType('bug');
      setFeedbackSeverity('medium');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. It will be saved for later.');
    }
  };

  const handleApplyUpdate = async () => {
    if (!updateAvailable) return;

    Alert.alert(
      'Apply Update',
      `Version ${updateAvailable.version}\n\n${updateAvailable.releaseNotes}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdating(true);
              await betaTesting.applyUpdate();
              // App will reload
            } catch (error) {
              Alert.alert('Update Failed', 'Please try again later');
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleShareBeta = async () => {
    try {
      await Share.share({
        message: 'Join the Voting App beta program! Use invite code: VOTINGBETA',
        title: 'Join Beta Program',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ProgressBar indeterminate />
      </View>
    );
  }

  if (!isBetaTester) {
    return (
      <ScrollView style={styles.container}>
        <Surface style={styles.heroCard}>
          <IconButton
            icon="rocket-launch"
            size={48}
            iconColor={theme.colors.primary}
          />
          <Text variant="headlineMedium" style={styles.heroTitle}>
            Join Beta Program
          </Text>
          <Text variant="bodyLarge" style={styles.heroDescription}>
            Get early access to new features and help shape the future of the app
          </Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Beta Program Benefits
            </Text>
            <List.Item
              title="Early Access"
              description="Try new features before they're released"
              left={(props) => <List.Icon {...props} icon="star" />}
            />
            <List.Item
              title="Direct Feedback"
              description="Your feedback directly influences development"
              left={(props) => <List.Icon {...props} icon="comment-quote" />}
            />
            <List.Item
              title="Exclusive Updates"
              description="Get insider updates and release notes"
              left={(props) => <List.Icon {...props} icon="email" />}
            />
            <List.Item
              title="Beta Badge"
              description="Show your beta tester status in the app"
              left={(props) => <List.Icon {...props} icon="shield-star" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Join Beta Program
            </Text>
            <TextInput
              mode="outlined"
              label="Invite Code (Optional)"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter invite code"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleEnrollBeta}
              loading={enrolling}
              disabled={enrolling}
              style={styles.button}
            >
              Join Beta Program
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Banner
        visible={updateAvailable !== null}
        actions={[
          {
            label: 'Update Now',
            onPress: handleApplyUpdate,
          },
          {
            label: 'Later',
            onPress: () => setUpdateAvailable(null),
          },
        ]}
        icon="download"
      >
        New beta update available: Version {updateAvailable?.version}
      </Banner>

      <Surface style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <IconButton
            icon="shield-star"
            size={32}
            iconColor={theme.colors.primary}
          />
          <Text variant="titleLarge">Beta Tester</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{betaStats?.feedbackSubmitted || 0}</Text>
            <Text variant="bodySmall">Feedback Submitted</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{betaStats?.activeTesters || 0}</Text>
            <Text variant="bodySmall">Active Testers</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{betaStats?.currentVersion || 'N/A'}</Text>
            <Text variant="bodySmall">Current Version</Text>
          </View>
        </View>
      </Surface>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Quick Actions
          </Text>
          <Button
            mode="contained"
            onPress={() => setFeedbackDialogVisible(true)}
            icon="comment-plus"
            style={styles.actionButton}
          >
            Submit Feedback
          </Button>
          <Button
            mode="outlined"
            onPress={handleShareBeta}
            icon="share"
            style={styles.actionButton}
          >
            Invite Friends
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Beta Features
          </Text>
          <Chip icon="check" style={styles.chip}>Experimental UI</Chip>
          <Chip icon="check" style={styles.chip}>Debug Mode</Chip>
          <Chip icon="check" style={styles.chip}>Early Access Features</Chip>
          <Chip icon="check" style={styles.chip}>Detailed Analytics</Chip>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Beta Information
          </Text>
          <List.Item
            title="Joined"
            description={betaTesting.getBetaTesterInfo()?.joinedAt || 'Unknown'}
          />
          <List.Item
            title="Platform"
            description={Platform.OS}
          />
          <List.Item
            title="Build Number"
            description={betaTesting.getBetaTesterInfo()?.buildNumber || 'Unknown'}
          />
          <Divider style={styles.divider} />
          <Button
            mode="text"
            onPress={handleLeaveBeta}
            textColor={theme.colors.error}
          >
            Leave Beta Program
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={feedbackDialogVisible}
          onDismiss={() => setFeedbackDialogVisible(false)}
        >
          <Dialog.Title>Submit Feedback</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="labelLarge">Type</Text>
              <RadioButton.Group
                onValueChange={(value) => setFeedbackType(value as any)}
                value={feedbackType}
              >
                <RadioButton.Item label="Bug Report" value="bug" />
                <RadioButton.Item label="Feature Request" value="feature" />
                <RadioButton.Item label="Performance Issue" value="performance" />
                <RadioButton.Item label="UI/UX Feedback" value="ui" />
                <RadioButton.Item label="Other" value="other" />
              </RadioButton.Group>

              <Text variant="labelLarge" style={styles.fieldLabel}>Severity</Text>
              <RadioButton.Group
                onValueChange={(value) => setFeedbackSeverity(value as any)}
                value={feedbackSeverity}
              >
                <RadioButton.Item label="Low" value="low" />
                <RadioButton.Item label="Medium" value="medium" />
                <RadioButton.Item label="High" value="high" />
                <RadioButton.Item label="Critical" value="critical" />
              </RadioButton.Group>

              <TextInput
                mode="outlined"
                label="Title *"
                value={feedbackTitle}
                onChangeText={setFeedbackTitle}
                style={styles.dialogInput}
              />

              <TextInput
                mode="outlined"
                label="Description *"
                value={feedbackDescription}
                onChangeText={setFeedbackDescription}
                multiline
                numberOfLines={4}
                style={styles.dialogInput}
              />

              <TextInput
                mode="outlined"
                label="Steps to Reproduce (Optional)"
                value={feedbackSteps}
                onChangeText={setFeedbackSteps}
                multiline
                numberOfLines={3}
                style={styles.dialogInput}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setFeedbackDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSubmitFeedback}>Submit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {updating && (
        <Portal>
          <Dialog visible={updating} dismissable={false}>
            <Dialog.Content>
              <View style={styles.updatingContainer}>
                <ProgressBar indeterminate />
                <Text style={styles.updatingText}>Applying update...</Text>
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  heroCard: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },
  heroTitle: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  actionButton: {
    marginVertical: 4,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  dialogInput: {
    marginVertical: 8,
  },
  updatingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  updatingText: {
    marginTop: 16,
  },
});