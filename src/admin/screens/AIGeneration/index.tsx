import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Card,
  List,
  Divider,
  IconButton,
  ActivityIndicator,
  FAB,
  Portal,
  Modal,
  RadioButton,
  Slider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { aiGenerationAPI } from '../../../services/api/admin/aiGeneration';
import { format } from 'date-fns';

interface Character {
  id: string;
  name: string;
  ethnicity: string;
  body_type: string;
  breast_size: string;
  ass_size: string;
  hair: string;
  age_range: string;
}

interface GenerationJob {
  id: string;
  character_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  tags?: any;
  error?: string;
}

export default function AIGeneration() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [generationSettings, setGenerationSettings] = useState({
    focus: 'mixed' as 'ass' | 'tits' | 'mixed',
    count: 20,
    includeNude: false,
  });
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);
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
      setLoadingData(true);
      const [charactersData, jobsData] = await Promise.all([
        aiGenerationAPI.getCharacters(),
        aiGenerationAPI.getJobs({ limit: 10 }),
      ]);
      setCharacters(charactersData.characters || []);
      setJobs(jobsData || []);
      
      // Enable polling if any jobs are processing
      const hasActiveJobs = jobsData.some(
        (job: GenerationJob) => job.status === 'pending' || job.status === 'processing'
      );
      setPolling(hasActiveJobs);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load AI generation data');
    } finally {
      setLoadingData(false);
    }
  };

  const loadJobs = async () => {
    try {
      const jobsData = await aiGenerationAPI.getJobs({ limit: 10 });
      setJobs(jobsData || []);
      
      const hasActiveJobs = jobsData.some(
        (job: GenerationJob) => job.status === 'pending' || job.status === 'processing'
      );
      setPolling(hasActiveJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setModalVisible(true);
  };

  const handleGenerate = async () => {
    if (!selectedCharacter) {
      Alert.alert('Error', 'Please select a character');
      return;
    }
    
    if (generationSettings.count < 1 || generationSettings.count > 100) {
      Alert.alert('Error', 'Count must be between 1 and 100');
      return;
    }
    
    Alert.alert(
      'Confirm Generation',
      `Generate ${generationSettings.count} images for ${selectedCharacter.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setLoading(true);
            setModalVisible(false);
            try {
              const jobs = await aiGenerationAPI.batchGenerate(
                selectedCharacter.id,
                generationSettings.count,
                {
                  focus: generationSettings.focus,
                  includeNude: generationSettings.includeNude,
                }
              );
              
              Alert.alert(
                'Success',
                `Started generation of ${jobs.length} images. Check the job queue for progress.`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
              
              setPolling(true);
            } catch (error) {
              console.error('Failed to start generation:', error);
              Alert.alert('Error', 'Failed to start generation');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const viewJobDetails = async (job: GenerationJob) => {
    setSelectedJob(job);
    // Job details can be implemented later
    Alert.alert('Job Details', `Job ${job.id} - Status: ${job.status}`)
  };

  const renderCharacterCard = (character: Character) => (
    <Card key={character.id} style={styles.characterCard} onPress={() => handleCharacterSelect(character)}>
      <Card.Content>
        <View style={styles.characterHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium">{character.name}</Text>
            <View style={styles.chipContainer}>
              <Chip mode="flat" style={styles.chip} compact>
                {character.ethnicity}
              </Chip>
              <Chip mode="flat" style={styles.chip} compact>
                {character.body_type}
              </Chip>
              <Chip mode="flat" style={styles.chip} compact>
                {character.age_range}
              </Chip>
            </View>
          </View>
          <IconButton
            icon="creation"
            mode="contained"
            size={24}
            onPress={() => handleCharacterSelect(character)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'failed': return theme.colors.error;
      case 'processing': return theme.colors.primary;
      case 'cancelled': return theme.colors.onSurfaceVariant;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  if (loadingData) {
    return (
      <AdminRoute>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading AI generation data...</Text>
        </View>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium">AI Image Generation</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Generate character images using local Stable Diffusion
          </Text>
        </View>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{characters.length}</Text>
                <Text variant="bodyMedium">Characters</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">
                  {jobs.filter(j => j.status === 'processing').length}
                </Text>
                <Text variant="bodyMedium">Active Jobs</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">
                  {jobs.filter(j => j.status === 'completed').length}
                </Text>
                <Text variant="bodyMedium">Completed</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Active Jobs */}
        {jobs.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Active Jobs</Text>
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={loadJobs}
                />
              </View>
              <Divider style={styles.divider} />
              {jobs.slice(0, 5).map((job, index) => {
                const character = characters.find(c => c.id === job.character_id);
                return (
                  <React.Fragment key={job.id}>
                    {index > 0 && <Divider />}
                    <List.Item
                      title={character?.name || job.character_id}
                      description={`${job.status} • ${format(new Date(job.created_at), 'MMM d, h:mm a')}`}
                      onPress={() => viewJobDetails(job)}
                      left={() => (
                        <List.Icon
                          icon={
                            job.status === 'completed' ? 'check-circle' :
                            job.status === 'failed' ? 'alert-circle' :
                            job.status === 'processing' ? 'loading' :
                            'clock-outline'
                          }
                          color={getStatusColor(job.status)}
                        />
                      )}
                    />
                  </React.Fragment>
                );
              })}
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
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Characters</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Select a character to generate images
            </Text>
          </Card.Content>
        </Card>

        {/* Character List */}
        <View style={styles.characterList}>
          {characters.map(renderCharacterCard)}
        </View>

      </ScrollView>

      {/* Generation Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedCharacter && (
            <Surface style={styles.modal} elevation={0}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge">Generate Images</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setModalVisible(false)}
                />
              </View>
              
              <ScrollView style={styles.modalBody}>
                <Text variant="titleMedium">{selectedCharacter.name}</Text>
                <Text variant="bodyMedium" style={styles.characterInfo}>
                  {selectedCharacter.ethnicity} • {selectedCharacter.body_type} • {selectedCharacter.age_range}
                </Text>
                
                <Divider style={styles.divider} />
                
                {/* Focus Type */}
                <View style={styles.modalSection}>
                  <Text variant="bodyMedium" style={styles.sectionLabel}>Focus Type</Text>
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
                
                {/* Number of Images */}
                <View style={styles.modalSection}>
                  <Text variant="bodyMedium" style={styles.sectionLabel}>
                    Number of Images: {generationSettings.count}
                  </Text>
                  <Slider
                    value={generationSettings.count}
                    onValueChange={(val) => setGenerationSettings(prev => ({ ...prev, count: Math.round(val) }))}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    style={styles.slider}
                  />
                  <View style={styles.sliderLabels}>
                    <Text variant="bodySmall">1</Text>
                    <Text variant="bodySmall">50</Text>
                  </View>
                </View>
                
                {/* Include Nude */}
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
                
                {/* Generate Button */}
                <Button
                  mode="contained"
                  onPress={handleGenerate}
                  loading={loading}
                  disabled={loading}
                  style={styles.generateButton}
                  icon="creation"
                >
                  Start Generation
                </Button>
              </ScrollView>
            </Surface>
          )}
        </Modal>
      </Portal>
    </AdminRoute>
  );
}

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
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  viewMoreButton: {
    marginTop: 8,
  },
  characterList: {
    paddingHorizontal: 16,
  },
  characterCard: {
    marginBottom: 12,
  },
  characterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    height: 24,
  },
  modalContent: {
    margin: 20,
    maxHeight: '80%',
  },
  modal: {
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBody: {
    maxHeight: 400,
  },
  characterInfo: {
    marginTop: 4,
    opacity: 0.7,
  },
  modalSection: {
    marginVertical: 16,
  },
  sectionLabel: {
    marginBottom: 12,
    fontWeight: '500',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipOption: {
    marginRight: 8,
    marginBottom: 8,
  },
  slider: {
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  generateButton: {
    marginTop: 24,
  },
});