import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  Card,
  Button,
  ProgressBar,
  Chip,
  List,
  Divider,
  ActivityIndicator,
  IconButton,
  DataTable,
  FAB,
  Portal,
  Dialog,
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { contentPipeline, type AutoTagSuggestion } from '../../../services/content/contentPipeline';
import { adminAPI } from '../../services/adminAPI';
import { format } from 'date-fns';

export default function ContentPipeline() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pipelineStats, setPipelineStats] = useState<any>(null);
  const [pendingImages, setPendingImages] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [batchOperation, setBatchOperation] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoTagSuggestions, setAutoTagSuggestions] = useState<AutoTagSuggestion[]>([]);
  const [showAutoTagDialog, setShowAutoTagDialog] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Load pipeline analytics
      const stats = await contentPipeline.getPipelineAnalytics();
      setPipelineStats(stats);
      
      // Load pending images
      const images = await adminAPI.getPendingImages(50);
      setPendingImages(images);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
      Alert.alert('Error', 'Failed to load pipeline data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedImages(new Set(pendingImages.map(img => img.imageId)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  const handleBatchOperation = async (operation: 'approve' | 'reject' | 'tag' | 'promote') => {
    if (selectedImages.size === 0) {
      Alert.alert('Error', 'No images selected');
      return;
    }

    setBatchOperation(operation);
    
    if (operation === 'tag') {
      // Generate auto-tag suggestions
      setProcessing(true);
      try {
        const suggestions = await contentPipeline.generateAutoTags(Array.from(selectedImages));
        setAutoTagSuggestions(suggestions);
        setShowAutoTagDialog(true);
      } catch (error) {
        console.error('Failed to generate auto-tags:', error);
        Alert.alert('Error', 'Failed to generate auto-tag suggestions');
      } finally {
        setProcessing(false);
      }
      return;
    }

    Alert.alert(
      `Batch ${operation}`,
      `${operation} ${selectedImages.size} images?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessing(true);
            try {
              const result = await contentPipeline.processBatch(
                operation,
                Array.from(selectedImages),
                operation === 'promote' ? { weight: 5 } : undefined
              );
              
              const successCount = result.results?.filter(r => r.success).length || 0;
              Alert.alert(
                'Batch Operation Complete',
                `Successfully processed ${successCount} out of ${selectedImages.size} images`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
              
              setSelectedImages(new Set());
            } catch (error) {
              console.error('Batch operation failed:', error);
              Alert.alert('Error', 'Failed to complete batch operation');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const applyAutoTags = async () => {
    setShowAutoTagDialog(false);
    setProcessing(true);
    
    try {
      const results = await contentPipeline.applyAutoTags(autoTagSuggestions);
      const successCount = results.filter(r => r.success).length;
      
      Alert.alert(
        'Auto-Tagging Complete',
        `Successfully tagged ${successCount} out of ${autoTagSuggestions.length} images`,
        [{ text: 'OK', onPress: () => loadData() }]
      );
      
      setSelectedImages(new Set());
      setAutoTagSuggestions([]);
    } catch (error) {
      console.error('Failed to apply auto-tags:', error);
      Alert.alert('Error', 'Failed to apply auto-tags');
    } finally {
      setProcessing(false);
    }
  };

  const renderPipelineStats = () => {
    if (!pipelineStats) return null;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Pipeline Overview
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={styles.statValue}>
                {pipelineStats.total}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Images
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.warning }]}>
                {pipelineStats.pending}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Pending Review
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.success }]}>
                {pipelineStats.approvalRate.toFixed(0)}%
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Approval Rate
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={styles.statValue}>
                {pipelineStats.avgProcessingTime}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Avg. Processing
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text variant="titleSmall" style={styles.categoryTitle}>
            Category Distribution
          </Text>
          <View style={styles.categoryChips}>
            {Object.entries(pipelineStats.categoriesDistribution)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([category, count]) => (
                <Chip key={category} mode="flat" style={styles.categoryChip}>
                  {category}: {count}
                </Chip>
              ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderPendingImages = () => {
    if (pendingImages.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons
              name="check-all"
              size={64}
              color={theme.colors.success}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              No pending images
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              All images have been processed
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.tableCard}>
        <Card.Content>
          <View style={styles.tableHeader}>
            <Text variant="titleMedium">Pending Images ({pendingImages.length})</Text>
            <View style={styles.tableActions}>
              {selectedImages.size > 0 ? (
                <>
                  <Button mode="text" onPress={deselectAll} compact>
                    Deselect All
                  </Button>
                  <Text variant="bodyMedium" style={styles.selectionCount}>
                    {selectedImages.size} selected
                  </Text>
                </>
              ) : (
                <Button mode="text" onPress={selectAll} compact>
                  Select All
                </Button>
              )}
            </View>
          </View>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={styles.checkColumn}></DataTable.Title>
              <DataTable.Title>ID</DataTable.Title>
              <DataTable.Title>Character</DataTable.Title>
              <DataTable.Title>Source</DataTable.Title>
              <DataTable.Title>Created</DataTable.Title>
            </DataTable.Header>

            <ScrollView style={styles.tableScroll}>
              {pendingImages.map((image) => (
                <DataTable.Row
                  key={image.imageId}
                  onPress={() => toggleImageSelection(image.imageId)}
                  style={selectedImages.has(image.imageId) ? styles.selectedRow : undefined}
                >
                  <DataTable.Cell style={styles.checkColumn}>
                    <RadioButton
                      value=""
                      status={selectedImages.has(image.imageId) ? 'checked' : 'unchecked'}
                      onPress={() => toggleImageSelection(image.imageId)}
                    />
                  </DataTable.Cell>
                  <DataTable.Cell>{image.imageId.slice(-8)}</DataTable.Cell>
                  <DataTable.Cell>{image.characterName}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip compact mode="flat" style={styles.sourceChip}>
                      {image.source}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {format(new Date(image.createdAt), 'MMM d')}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </ScrollView>
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading pipeline data...</Text>
        </View>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium">Content Pipeline</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage and process content efficiently
          </Text>
        </View>

        {/* Pipeline Stats */}
        {renderPipelineStats()}

        {/* Pending Images Table */}
        {renderPendingImages()}

        {/* Auto-Tag Dialog */}
        <Portal>
          <Dialog
            visible={showAutoTagDialog}
            onDismiss={() => setShowAutoTagDialog(false)}
          >
            <Dialog.Title>Auto-Tag Suggestions</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Generated {autoTagSuggestions.length} tag suggestions with an average confidence of{' '}
                {(
                  autoTagSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
                  autoTagSuggestions.length * 100
                ).toFixed(0)}%
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowAutoTagDialog(false)}>Cancel</Button>
              <Button onPress={applyAutoTags}>Apply Tags</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* FAB Menu */}
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible={selectedImages.size > 0 && !processing}
            icon={fabOpen ? 'close' : 'dots-vertical'}
            actions={[
              {
                icon: 'check',
                label: 'Approve',
                onPress: () => handleBatchOperation('approve'),
              },
              {
                icon: 'close',
                label: 'Reject',
                onPress: () => handleBatchOperation('reject'),
              },
              {
                icon: 'tag-multiple',
                label: 'Auto-Tag',
                onPress: () => handleBatchOperation('tag'),
              },
              {
                icon: 'star',
                label: 'Promote',
                onPress: () => handleBatchOperation('promote'),
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
          />
        </Portal>

        {/* Processing Overlay */}
        {processing && (
          <Portal>
            <View style={styles.processingOverlay}>
              <Surface style={styles.processingCard} elevation={4}>
                <ActivityIndicator size="large" />
                <Text variant="titleMedium" style={styles.processingText}>
                  Processing batch operation...
                </Text>
              </Surface>
            </View>
          </Portal>
        )}
      </ScrollView>
    </AdminRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 100,
  },
  centerContainer: {
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
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  categoryTitle: {
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
  },
  emptySubtext: {
    marginTop: 8,
    opacity: 0.7,
  },
  tableCard: {
    margin: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tableActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionCount: {
    opacity: 0.7,
  },
  tableScroll: {
    maxHeight: 400,
  },
  checkColumn: {
    width: 50,
  },
  selectedRow: {
    backgroundColor: 'rgba(98, 0, 238, 0.08)',
  },
  sourceChip: {
    height: 24,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
  },
});