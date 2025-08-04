import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Chip,
  ProgressBar,
  Text,
  Divider,
  ActivityIndicator,
  IconButton,
  DataTable,
  Portal,
  Modal,
  TextInput,
  Surface,
} from 'react-native-paper';
import { aiGenerationAPI } from '@/services/api/admin/aiGeneration';

interface Character {
  id: string;
  name: string;
  ethnicity: string;
  body_type: string;
  training_status?: 'pending' | 'trained' | 'generating';
  images_count?: number;
}

interface GenerationJob {
  id: string;
  character_id: string;
  status: string;
  progress: number;
  created_at: string;
  error?: string;
}

export const AIGenerationTab: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [generationModalVisible, setGenerationModalVisible] = useState(false);
  const [generationSettings, setGenerationSettings] = useState({
    focus: 'mixed', // ass, tits, mixed
    count: 20,
    includeNude: false,
  });
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadData();
    // Poll for job updates
    const interval = setInterval(() => {
      if (polling) {
        loadJobs();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [charactersData, jobsData] = await Promise.all([
        aiGenerationAPI.getCharacters(),
        aiGenerationAPI.getJobs(),
      ]);
      setCharacters(charactersData.characters || []);
      setJobs(jobsData || []);
      
      // Enable polling if any jobs are processing
      const hasActiveJobs = jobsData.some(
        (job: GenerationJob) => job.status === 'pending' || job.status === 'processing'
      );
      setPolling(hasActiveJobs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load AI generation data');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const jobsData = await aiGenerationAPI.getJobs();
      setJobs(jobsData || []);
      
      const hasActiveJobs = jobsData.some(
        (job: GenerationJob) => job.status === 'pending' || job.status === 'processing'
      );
      setPolling(hasActiveJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleGenerateImages = async () => {
    if (!selectedCharacter) return;

    try {
      setGenerationModalVisible(false);
      
      // Generate based on settings
      const requests = [];
      const perFocus = generationSettings.focus === 'mixed' 
        ? generationSettings.count / 2 
        : generationSettings.count;

      if (generationSettings.focus === 'ass' || generationSettings.focus === 'mixed') {
        for (let i = 0; i < perFocus; i++) {
          requests.push(
            aiGenerationAPI.generateImage({
              character_id: selectedCharacter.id,
              focus: 'ass',
              is_nude: generationSettings.includeNude && i % 4 === 0, // 25% nude
              batch_size: 1,
            })
          );
        }
      }

      if (generationSettings.focus === 'tits' || generationSettings.focus === 'mixed') {
        for (let i = 0; i < perFocus; i++) {
          requests.push(
            aiGenerationAPI.generateImage({
              character_id: selectedCharacter.id,
              focus: 'tits',
              is_nude: generationSettings.includeNude && i % 4 === 0, // 25% nude
              batch_size: 1,
            })
          );
        }
      }

      // Execute all requests
      const results = await Promise.all(requests);
      
      Alert.alert(
        'Success',
        `Started generation of ${requests.length} images for ${selectedCharacter.name}`
      );
      
      setPolling(true);
      loadJobs();
    } catch (error) {
      Alert.alert('Error', 'Failed to start image generation');
    }
  };

  const getJobProgress = (job: GenerationJob) => {
    if (job.status === 'completed') return 1;
    if (job.status === 'failed') return 0;
    return job.progress || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'processing':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderCharacterCard = (character: Character) => (
    <Card key={character.id} style={styles.characterCard}>
      <Card.Content>
        <View style={styles.characterHeader}>
          <View style={{ flex: 1 }}>
            <Title>{character.name}</Title>
            <View style={styles.chipContainer}>
              <Chip mode="flat" style={styles.chip}>
                {character.ethnicity}
              </Chip>
              <Chip mode="flat" style={styles.chip}>
                {character.body_type}
              </Chip>
            </View>
          </View>
          <View style={styles.characterStats}>
            <Text variant="titleMedium">{character.images_count || 0}</Text>
            <Text variant="bodySmall">Images</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="outlined"
          onPress={() => {
            setSelectedCharacter(character);
            setGenerationModalVisible(true);
          }}
        >
          Generate Images
        </Button>
        <Button
          mode="text"
          onPress={() => Alert.alert('Coming Soon', 'Character details view')}
        >
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderJobRow = (job: GenerationJob) => {
    const character = characters.find(c => c.id === job.character_id);
    const progress = getJobProgress(job);

    return (
      <Surface key={job.id} style={styles.jobRow}>
        <View style={styles.jobInfo}>
          <Text variant="bodyMedium">{character?.name || job.character_id}</Text>
          <Text variant="bodySmall" style={{ color: getStatusColor(job.status) }}>
            {job.status}
          </Text>
        </View>
        <View style={styles.jobProgress}>
          <ProgressBar 
            progress={progress} 
            color={getStatusColor(job.status)}
            style={styles.progressBar}
          />
          <Text variant="bodySmall">{Math.round(progress * 100)}%</Text>
        </View>
        {job.error && (
          <IconButton
            icon="alert-circle"
            size={20}
            onPress={() => Alert.alert('Error', job.error)}
          />
        )}
      </Surface>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading AI generation data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Statistics */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>AI Generation Overview</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{characters.length}</Text>
              <Text variant="bodyMedium">Characters</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">
                {characters.reduce((sum, c) => sum + (c.images_count || 0), 0)}
              </Text>
              <Text variant="bodyMedium">Total Images</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">
                {jobs.filter(j => j.status === 'processing').length}
              </Text>
              <Text variant="bodyMedium">Active Jobs</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <Card style={styles.section}>
          <Card.Content>
            <Title>Generation Queue</Title>
            <Divider style={styles.divider} />
            {jobs.slice(0, 5).map(renderJobRow)}
            {jobs.length > 5 && (
              <Button
                mode="text"
                onPress={() => Alert.alert('Coming Soon', 'Full job queue view')}
                style={styles.viewMoreButton}
              >
                View All ({jobs.length} total)
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Characters */}
      <Card style={styles.section}>
        <Card.Content>
          <Title>Characters</Title>
          <Paragraph>Select a character to generate images</Paragraph>
        </Card.Content>
      </Card>

      {characters.map(renderCharacterCard)}

      {/* Generation Modal */}
      <Portal>
        <Modal
          visible={generationModalVisible}
          onDismiss={() => setGenerationModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Generate Images for {selectedCharacter?.name}</Title>
          
          <View style={styles.modalSection}>
            <Text variant="bodyMedium">Focus Type</Text>
            <View style={styles.chipGroup}>
              <Chip
                selected={generationSettings.focus === 'mixed'}
                onPress={() => setGenerationSettings(prev => ({ ...prev, focus: 'mixed' }))}
                style={styles.chipOption}
              >
                Mixed (50/50)
              </Chip>
              <Chip
                selected={generationSettings.focus === 'ass'}
                onPress={() => setGenerationSettings(prev => ({ ...prev, focus: 'ass' }))}
                style={styles.chipOption}
              >
                Ass Focus
              </Chip>
              <Chip
                selected={generationSettings.focus === 'tits'}
                onPress={() => setGenerationSettings(prev => ({ ...prev, focus: 'tits' }))}
                style={styles.chipOption}
              >
                Tits Focus
              </Chip>
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text variant="bodyMedium">Number of Images</Text>
            <View style={styles.chipGroup}>
              {[10, 20, 50].map(count => (
                <Chip
                  key={count}
                  selected={generationSettings.count === count}
                  onPress={() => setGenerationSettings(prev => ({ ...prev, count }))}
                  style={styles.chipOption}
                >
                  {count} images
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.modalSection}>
            <Chip
              selected={generationSettings.includeNude}
              onPress={() => 
                setGenerationSettings(prev => ({ ...prev, includeNude: !prev.includeNude }))
              }
              style={styles.chipOption}
            >
              Include Nude Variations (25%)
            </Chip>
          </View>

          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setGenerationModalVisible(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleGenerateImages}>
              Start Generation
            </Button>
          </View>
        </Modal>
      </Portal>
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
  loadingText: {
    marginTop: 16,
  },
  statsCard: {
    margin: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  divider: {
    marginVertical: 12,
  },
  characterCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  characterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    height: 24,
  },
  characterStats: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  jobInfo: {
    flex: 1,
  },
  jobProgress: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
  },
  viewMoreButton: {
    marginTop: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalSection: {
    marginVertical: 16,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chipOption: {
    marginRight: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
});