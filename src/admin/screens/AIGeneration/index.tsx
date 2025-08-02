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
import { aiService, type GenerationResult, type PromptTemplate } from '../../../services/ai/aiService';
import { format } from 'date-fns';

interface TemplateVariables {
  [key: string]: any;
}

export default function AIGeneration() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<'custom' | 'template'>('template');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariables>({});
  const [quantity, setQuantity] = useState(1);
  const [characterName, setCharacterName] = useState('');
  const [recentGenerations, setRecentGenerations] = useState<GenerationResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationResult | null>(null);
  
  // Get prompt templates
  const templates = aiService.getPromptTemplates();

  useEffect(() => {
    loadGenerationHistory();
  }, []);

  useEffect(() => {
    // Set default template and variables
    if (templates.length > 0 && !selectedTemplate) {
      const defaultTemplate = templates[0];
      setSelectedTemplate(defaultTemplate.id);
      initializeTemplateVariables(defaultTemplate);
    }
  }, [templates]);

  const loadGenerationHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await aiService.getGenerationHistory(10);
      setRecentGenerations(history);
    } catch (error) {
      console.error('Failed to load generation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const initializeTemplateVariables = (template: PromptTemplate) => {
    const variables: TemplateVariables = {};
    template.variables.forEach(variable => {
      variables[variable.name] = variable.default || '';
    });
    setTemplateVariables(variables);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      initializeTemplateVariables(template);
    }
  };

  const updateTemplateVariable = (name: string, value: any) => {
    setTemplateVariables(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getGeneratedPrompt = (): string => {
    if (generationMode === 'custom') {
      return customPrompt;
    }
    
    if (!selectedTemplate) return '';
    
    try {
      return aiService.buildPromptFromTemplate(selectedTemplate, templateVariables);
    } catch (error) {
      console.error('Failed to build prompt:', error);
      return '';
    }
  };

  const handleGenerate = async () => {
    const prompt = getGeneratedPrompt();
    
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt or select a template');
      return;
    }
    
    if (quantity < 1 || quantity > 10) {
      Alert.alert('Error', 'Quantity must be between 1 and 10');
      return;
    }
    
    const estimatedCost = aiService.estimateGenerationCost(quantity);
    
    Alert.alert(
      'Confirm Generation',
      `Generate ${quantity} image${quantity > 1 ? 's' : ''} for approximately $${estimatedCost.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await aiService.queueGeneration({
                prompt,
                characterName: characterName || undefined,
                quantity,
                metadata: generationMode === 'template' ? templateVariables : undefined,
              });
              
              Alert.alert(
                'Success',
                'Generation queued successfully. Check the history for updates.',
                [{ text: 'OK', onPress: () => loadGenerationHistory() }]
              );
              
              // Reset form
              setCustomPrompt('');
              setCharacterName('');
              setQuantity(1);
            } catch (error) {
              console.error('Failed to queue generation:', error);
              Alert.alert('Error', 'Failed to queue generation');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openGenerationDetails = async (generation: GenerationResult) => {
    setSelectedGeneration(generation);
    setModalVisible(true);
    
    // If still processing, check for updates
    if (generation.status === 'pending' || generation.status === 'processing') {
      try {
        const updated = await aiService.getGenerationStatus(generation.generationId);
        setSelectedGeneration(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          loadGenerationHistory();
        }
      } catch (error) {
        console.error('Failed to get generation status:', error);
      }
    }
  };

  const renderTemplateVariable = (template: PromptTemplate, variable: any) => {
    const value = templateVariables[variable.name];
    
    switch (variable.type) {
      case 'text':
        return (
          <TextInput
            key={variable.name}
            mode="outlined"
            label={variable.name}
            value={value}
            onChangeText={(text) => updateTemplateVariable(variable.name, text)}
            style={styles.variableInput}
            dense
          />
        );
      
      case 'select':
        return (
          <View key={variable.name} style={styles.variableSelect}>
            <Text variant="labelMedium" style={styles.variableLabel}>
              {variable.name}
            </Text>
            <RadioButton.Group
              value={value}
              onValueChange={(val) => updateTemplateVariable(variable.name, val)}
            >
              <View style={styles.radioOptions}>
                {variable.options?.map(option => (
                  <View key={option} style={styles.radioOption}>
                    <RadioButton value={option} />
                    <Text onPress={() => updateTemplateVariable(variable.name, option)}>
                      {option}
                    </Text>
                  </View>
                ))}
              </View>
            </RadioButton.Group>
          </View>
        );
      
      case 'number':
        return (
          <View key={variable.name} style={styles.variableSlider}>
            <Text variant="labelMedium" style={styles.variableLabel}>
              {variable.name}: {value}
            </Text>
            <Slider
              value={value}
              onValueChange={(val) => updateTemplateVariable(variable.name, Math.round(val))}
              minimumValue={18}
              maximumValue={65}
              step={1}
              style={styles.slider}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'failed': return theme.colors.error;
      case 'processing': return theme.colors.primary;
      case 'cancelled': return theme.colors.onSurfaceVariant;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <AdminRoute>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium">AI Image Generation</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Generate images using AI
            </Text>
          </View>

          {/* Generation Mode */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Generation Mode
              </Text>
              <SegmentedButtons
                value={generationMode}
                onValueChange={(value) => setGenerationMode(value as any)}
                buttons={[
                  { value: 'template', label: 'Use Template' },
                  { value: 'custom', label: 'Custom Prompt' },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>

          {/* Template Selection */}
          {generationMode === 'template' && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Select Template
                </Text>
                <View style={styles.templateChips}>
                  {templates.map(template => (
                    <Chip
                      key={template.id}
                      selected={selectedTemplate === template.id}
                      onPress={() => handleTemplateChange(template.id)}
                      style={styles.templateChip}
                    >
                      {template.name}
                    </Chip>
                  ))}
                </View>
                
                {selectedTemplate && (
                  <View style={styles.variablesSection}>
                    <Text variant="titleSmall" style={styles.variablesTitle}>
                      Template Variables
                    </Text>
                    {templates
                      .find(t => t.id === selectedTemplate)
                      ?.variables.map(variable => 
                        renderTemplateVariable(
                          templates.find(t => t.id === selectedTemplate)!,
                          variable
                        )
                      )}
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Custom Prompt */}
          {generationMode === 'custom' && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Custom Prompt
                </Text>
                <TextInput
                  mode="outlined"
                  label="Enter your prompt"
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  multiline
                  numberOfLines={4}
                  style={styles.promptInput}
                />
              </Card.Content>
            </Card>
          )}

          {/* Generation Options */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Generation Options
              </Text>
              
              <TextInput
                mode="outlined"
                label="Character Name (optional)"
                value={characterName}
                onChangeText={setCharacterName}
                style={styles.optionInput}
                dense
              />
              
              <View style={styles.quantitySection}>
                <Text variant="labelMedium">Quantity: {quantity}</Text>
                <Slider
                  value={quantity}
                  onValueChange={(val) => setQuantity(Math.round(val))}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  style={styles.slider}
                />
              </View>
              
              <View style={styles.costEstimate}>
                <Text variant="bodyMedium">
                  Estimated cost: ${aiService.estimateGenerationCost(quantity).toFixed(2)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Preview */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Prompt Preview
              </Text>
              <Surface style={styles.previewSurface} elevation={0}>
                <Text variant="bodyMedium" style={styles.previewText}>
                  {getGeneratedPrompt() || 'No prompt generated'}
                </Text>
              </Surface>
            </Card.Content>
          </Card>

          {/* Generate Button */}
          <Button
            mode="contained"
            onPress={handleGenerate}
            loading={loading}
            disabled={loading || !getGeneratedPrompt()}
            style={styles.generateButton}
            icon="creation"
          >
            Generate Images
          </Button>

          {/* Recent Generations */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.historyHeader}>
                <Text variant="titleMedium">Recent Generations</Text>
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={loadGenerationHistory}
                />
              </View>
              
              {loadingHistory ? (
                <ActivityIndicator style={styles.historyLoader} />
              ) : recentGenerations.length === 0 ? (
                <Text variant="bodyMedium" style={styles.emptyHistory}>
                  No generations yet
                </Text>
              ) : (
                <View>
                  {recentGenerations.map((generation, index) => (
                    <React.Fragment key={generation.generationId}>
                      {index > 0 && <Divider />}
                      <List.Item
                        title={`Generation ${generation.generationId.slice(-8)}`}
                        description={`${generation.status} • ${format(new Date(generation.createdAt), 'MMM d, h:mm a')}`}
                        onPress={() => openGenerationDetails(generation)}
                        left={() => (
                          <List.Icon
                            icon={
                              generation.status === 'completed' ? 'check-circle' :
                              generation.status === 'failed' ? 'alert-circle' :
                              generation.status === 'processing' ? 'loading' :
                              'clock-outline'
                            }
                            color={getStatusColor(generation.status)}
                          />
                        )}
                        right={() => (
                          generation.cost !== undefined ? (
                            <Text variant="bodyMedium">${generation.cost.toFixed(2)}</Text>
                          ) : null
                        )}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Generation Details Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContent}
          >
            {selectedGeneration && (
              <Surface style={styles.modal} elevation={0}>
                <View style={styles.modalHeader}>
                  <Text variant="titleLarge">Generation Details</Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setModalVisible(false)}
                  />
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <List.Item
                    title="Status"
                    description={selectedGeneration.status}
                    left={() => <List.Icon icon="information" />}
                  />
                  <Divider />
                  <List.Item
                    title="Created"
                    description={format(new Date(selectedGeneration.createdAt), 'MMM d, yyyy h:mm a')}
                    left={() => <List.Icon icon="calendar" />}
                  />
                  <Divider />
                  {selectedGeneration.cost !== undefined && (
                    <>
                      <List.Item
                        title="Cost"
                        description={`$${selectedGeneration.cost.toFixed(2)}`}
                        left={() => <List.Icon icon="currency-usd" />}
                      />
                      <Divider />
                    </>
                  )}
                  
                  {selectedGeneration.error && (
                    <Surface style={styles.errorSurface} elevation={0}>
                      <Text variant="bodyMedium" style={styles.errorText}>
                        {selectedGeneration.error}
                      </Text>
                    </Surface>
                  )}
                  
                  {selectedGeneration.images && selectedGeneration.images.length > 0 && (
                    <View style={styles.imagesSection}>
                      <Text variant="titleSmall" style={styles.imagesSectionTitle}>
                        Generated Images ({selectedGeneration.images.length})
                      </Text>
                      <Text variant="bodyMedium" style={styles.imagesNote}>
                        Images have been added to the pending review queue
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </Surface>
            )}
          </Modal>
        </Portal>
      </KeyboardAvoidingView>
    </AdminRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  cardTitle: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  templateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    marginBottom: 4,
  },
  variablesSection: {
    marginTop: 20,
  },
  variablesTitle: {
    marginBottom: 12,
  },
  variableInput: {
    marginBottom: 12,
  },
  variableSelect: {
    marginBottom: 16,
  },
  variableLabel: {
    marginBottom: 8,
  },
  radioOptions: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variableSlider: {
    marginBottom: 16,
  },
  slider: {
    marginTop: 8,
  },
  promptInput: {
    minHeight: 100,
  },
  optionInput: {
    marginBottom: 16,
  },
  quantitySection: {
    marginBottom: 16,
  },
  costEstimate: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  previewSurface: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  previewText: {
    fontStyle: 'italic',
  },
  generateButton: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLoader: {
    padding: 32,
  },
  emptyHistory: {
    textAlign: 'center',
    padding: 32,
    opacity: 0.6,
  },
  modalContent: {
    margin: 20,
    maxHeight: '80%',
  },
  modal: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
  },
  modalBody: {
    maxHeight: 400,
  },
  errorSurface: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
  },
  imagesSection: {
    padding: 16,
  },
  imagesSectionTitle: {
    marginBottom: 8,
  },
  imagesNote: {
    opacity: 0.7,
  },
});