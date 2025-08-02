import React, { useState } from 'react';
import {
  Modal,
  Portal,
  TextInput,
  Button,
  RadioButton,
  useTheme,
  IconButton,
  Chip,
  HelperText,
} from 'react-native-paper';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../common/Text';
import { feedbackService } from '@/services/monitoring/feedbackService';
import { errorTracker } from '@/services/monitoring/errorTracking';

interface FeedbackModalProps {
  visible: boolean;
  onDismiss: () => void;
  defaultType?: 'bug' | 'feature' | 'general';
  context?: {
    screen?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onDismiss,
  defaultType = 'general',
  context,
}) => {
  const theme = useTheme();
  const [type, setType] = useState<'bug' | 'feature' | 'general'>(defaultType);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await feedbackService.submitFeedback({
        type,
        message: message.trim(),
        email: email.trim() || undefined,
        severity: type === 'bug' ? severity : undefined,
        tags,
        context,
      });

      setSuccess(true);
      setTimeout(() => {
        onDismiss();
        resetForm();
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      errorTracker.logError(err as Error, {
        action: 'submit_feedback',
        metadata: { type, hasEmail: !!email },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType(defaultType);
    setMessage('');
    setEmail('');
    setSeverity('medium');
    setTags([]);
    setCurrentTag('');
    setError(null);
    setSuccess(false);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'bug':
        return 'bug';
      case 'feature':
        return 'lightbulb';
      default:
        return 'comment';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'bug':
        return theme.colors.error;
      case 'feature':
        return theme.colors.primary;
      default:
        return theme.colors.secondary;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <IconButton
                icon={getTypeIcon()}
                size={24}
                iconColor={getTypeColor()}
                style={styles.headerIcon}
              />
              <Text variant="headlineSmall" style={styles.title}>
                Send Feedback
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
                style={styles.closeButton}
              />
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <IconButton
                  icon="check-circle"
                  size={48}
                  iconColor={theme.colors.success}
                />
                <Text variant="titleMedium" style={styles.successText}>
                  Thank you for your feedback!
                </Text>
                <Text variant="bodyMedium" style={styles.successSubtext}>
                  We'll review it and get back to you if needed.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Feedback Type
                  </Text>
                  <RadioButton.Group
                    onValueChange={value => setType(value as typeof type)}
                    value={type}
                  >
                    <View style={styles.radioItem}>
                      <RadioButton value="bug" />
                      <Text>Bug Report</Text>
                    </View>
                    <View style={styles.radioItem}>
                      <RadioButton value="feature" />
                      <Text>Feature Request</Text>
                    </View>
                    <View style={styles.radioItem}>
                      <RadioButton value="general" />
                      <Text>General Feedback</Text>
                    </View>
                  </RadioButton.Group>
                </View>

                {type === 'bug' && (
                  <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      Severity
                    </Text>
                    <RadioButton.Group
                      onValueChange={value => setSeverity(value as typeof severity)}
                      value={severity}
                    >
                      <View style={styles.radioItem}>
                        <RadioButton value="low" />
                        <Text>Low - Minor issue</Text>
                      </View>
                      <View style={styles.radioItem}>
                        <RadioButton value="medium" />
                        <Text>Medium - Affects functionality</Text>
                      </View>
                      <View style={styles.radioItem}>
                        <RadioButton value="high" />
                        <Text>High - Blocks usage</Text>
                      </View>
                    </RadioButton.Group>
                  </View>
                )}

                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Your Feedback
                  </Text>
                  <TextInput
                    mode="outlined"
                    multiline
                    numberOfLines={6}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={
                      type === 'bug'
                        ? 'Please describe what happened, what you expected, and steps to reproduce...'
                        : type === 'feature'
                        ? 'Please describe the feature you would like to see...'
                        : 'Please share your thoughts...'
                    }
                    style={styles.textInput}
                    error={!!error && !message.trim()}
                  />
                  <HelperText type="info" visible>
                    {type === 'bug' && 'Include steps to reproduce the issue if possible'}
                    {type === 'feature' && 'Explain how this would improve your experience'}
                    {type === 'general' && 'We appreciate all feedback!'}
                  </HelperText>
                </View>

                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Tags (Optional)
                  </Text>
                  <View style={styles.tagInput}>
                    <TextInput
                      mode="outlined"
                      value={currentTag}
                      onChangeText={setCurrentTag}
                      placeholder="Add a tag"
                      style={styles.tagTextInput}
                      onSubmitEditing={addTag}
                    />
                    <IconButton
                      icon="plus"
                      size={20}
                      onPress={addTag}
                      disabled={!currentTag.trim()}
                    />
                  </View>
                  <View style={styles.tags}>
                    {tags.map(tag => (
                      <Chip
                        key={tag}
                        onClose={() => removeTag(tag)}
                        style={styles.tag}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Email (Optional)
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.emailInput}
                  />
                  <HelperText type="info" visible>
                    We'll only use this to follow up on your feedback
                  </HelperText>
                </View>

                {error && (
                  <HelperText type="error" visible style={styles.error}>
                    {error}
                  </HelperText>
                )}

                <View style={styles.actions}>
                  <Button
                    mode="text"
                    onPress={onDismiss}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || !message.trim()}
                  >
                    Submit Feedback
                  </Button>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 0,
    maxHeight: '90%',
    borderRadius: 8,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerIcon: {
    margin: 0,
  },
  title: {
    flex: 1,
    marginLeft: 8,
  },
  closeButton: {
    margin: 0,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  textInput: {
    minHeight: 120,
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagTextInput: {
    flex: 1,
    marginRight: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginBottom: 4,
  },
  emailInput: {
    marginBottom: 0,
  },
  error: {
    paddingHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 32,
  },
  successText: {
    marginTop: 16,
    textAlign: 'center',
  },
  successSubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});