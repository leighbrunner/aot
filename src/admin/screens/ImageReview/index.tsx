import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  ActivityIndicator,
  Chip,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Checkbox,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { adminAPI, type PendingImage } from '../../services/adminAPI';
import EnhancedImage from '../../../components/EnhancedImage';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2;

export default function ImageReview() {
  const theme = useTheme();
  const [images, setImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PendingImage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [customCategory, setCustomCategory] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Available categories - in production, these would come from the API
  const availableCategories = ['ass', 'tits', 'face', 'full-body', 'artistic'];

  useEffect(() => {
    loadPendingImages();
  }, []);

  const loadPendingImages = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const pendingImages = await adminAPI.getPendingImages(50);
      setImages(pendingImages);
    } catch (error) {
      console.error('Failed to load pending images:', error);
      Alert.alert('Error', 'Failed to load pending images');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingImages(true);
  };

  const openReviewModal = (image: PendingImage) => {
    setSelectedImage(image);
    
    // Pre-populate categories from image metadata
    const preSelectedCategories: Record<string, boolean> = {};
    image.categories?.forEach(cat => {
      preSelectedCategories[cat] = true;
    });
    setCategories(preSelectedCategories);
    
    setModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedImage) return;
    
    setProcessing(true);
    
    try {
      // Get selected categories
      const selectedCategories = Object.keys(categories).filter(cat => categories[cat]);
      if (customCategory) {
        selectedCategories.push(customCategory);
      }
      
      if (selectedCategories.length === 0) {
        Alert.alert('Error', 'Please select at least one category');
        setProcessing(false);
        return;
      }
      
      await adminAPI.approveImage(selectedImage.imageId, selectedCategories);
      
      // Remove from list
      setImages(prev => prev.filter(img => img.imageId !== selectedImage.imageId));
      
      // Reset modal
      setModalVisible(false);
      setSelectedImage(null);
      setCategories({});
      setCustomCategory('');
      
      setSnackbarMessage('Image approved successfully');
    } catch (error) {
      console.error('Failed to approve image:', error);
      Alert.alert('Error', 'Failed to approve image');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedImage) return;
    
    Alert.alert(
      'Reject Image',
      'Are you sure you want to reject this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            
            try {
              await adminAPI.rejectImage(selectedImage.imageId, rejectReason);
              
              // Remove from list
              setImages(prev => prev.filter(img => img.imageId !== selectedImage.imageId));
              
              // Reset modal
              setModalVisible(false);
              setSelectedImage(null);
              setRejectReason('');
              
              setSnackbarMessage('Image rejected');
            } catch (error) {
              console.error('Failed to reject image:', error);
              Alert.alert('Error', 'Failed to reject image');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
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

  const handleBulkApprove = async () => {
    if (selectedImages.size === 0) {
      Alert.alert('Error', 'No images selected');
      return;
    }
    
    Alert.alert(
      'Bulk Approve',
      `Approve ${selectedImages.size} images?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            setProcessing(true);
            
            try {
              // Approve each selected image
              const promises = Array.from(selectedImages).map(imageId =>
                adminAPI.approveImage(imageId, ['general']) // Default category for bulk
              );
              
              await Promise.all(promises);
              
              // Remove approved images from list
              setImages(prev => prev.filter(img => !selectedImages.has(img.imageId)));
              
              // Reset selection
              setSelectedImages(new Set());
              setBulkMode(false);
              
              setSnackbarMessage(`${selectedImages.size} images approved`);
            } catch (error) {
              console.error('Failed to bulk approve:', error);
              Alert.alert('Error', 'Failed to approve some images');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const renderImage = ({ item }: { item: PendingImage }) => {
    const isSelected = selectedImages.has(item.imageId);
    
    return (
      <TouchableOpacity
        onPress={() => {
          if (bulkMode) {
            toggleImageSelection(item.imageId);
          } else {
            openReviewModal(item);
          }
        }}
        onLongPress={() => {
          setBulkMode(true);
          toggleImageSelection(item.imageId);
        }}
        activeOpacity={0.8}
      >
        <Surface 
          style={[
            styles.imageCard,
            bulkMode && isSelected && styles.selectedCard
          ]} 
          elevation={2}
        >
          {bulkMode && (
            <View style={styles.selectionOverlay}>
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => toggleImageSelection(item.imageId)}
                color={theme.colors.primary}
              />
            </View>
          )}
          
          <EnhancedImage
            source={{ uri: item.url }}
            thumbnailSource={{ uri: item.thumbnailUrl }}
            style={styles.image}
            contentFit="cover"
          />
          
          <View style={styles.imageInfo}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {item.characterName}
            </Text>
            <Text variant="labelSmall" style={styles.imageSource}>
              Source: {item.source}
            </Text>
            <Text variant="labelSmall" style={styles.imageDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading pending images...</Text>
        </View>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium">Image Review</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {images.length} images pending review
            </Text>
          </View>
          {bulkMode && (
            <View style={styles.bulkActions}>
              <Text variant="labelMedium" style={styles.selectionCount}>
                {selectedImages.size} selected
              </Text>
              <Button
                mode="text"
                onPress={() => {
                  setBulkMode(false);
                  setSelectedImages(new Set());
                }}
              >
                Cancel
              </Button>
            </View>
          )}
        </View>

        {images.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="image-off"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              No pending images
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              All images have been reviewed
            </Text>
          </View>
        ) : (
          <FlatList
            data={images}
            renderItem={renderImage}
            keyExtractor={(item) => item.imageId}
            numColumns={2}
            contentContainerStyle={styles.imageGrid}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            columnWrapperStyle={styles.row}
          />
        )}

        {/* Bulk approve FAB */}
        {bulkMode && selectedImages.size > 0 && (
          <FAB
            icon="check-all"
            label="Approve Selected"
            onPress={handleBulkApprove}
            style={styles.fab}
            loading={processing}
          />
        )}

        {/* Review Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContent}
          >
            {selectedImage && (
              <Surface style={styles.modal} elevation={0}>
                <View style={styles.modalHeader}>
                  <Text variant="titleLarge">Review Image</Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setModalVisible(false)}
                  />
                </View>

                <EnhancedImage
                  source={{ uri: selectedImage.url }}
                  style={styles.modalImage}
                  contentFit="contain"
                />

                <View style={styles.modalInfo}>
                  <Text variant="titleMedium">{selectedImage.characterName}</Text>
                  <Text variant="bodyMedium" style={styles.modalMetadata}>
                    Source: {selectedImage.source} • Created: {new Date(selectedImage.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.categoriesSection}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Categories
                  </Text>
                  <View style={styles.categoryChips}>
                    {availableCategories.map(cat => (
                      <Chip
                        key={cat}
                        selected={categories[cat]}
                        onPress={() => setCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                        style={styles.categoryChip}
                      >
                        {cat}
                      </Chip>
                    ))}
                  </View>
                  <TextInput
                    mode="outlined"
                    label="Custom category"
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    style={styles.customCategoryInput}
                    dense
                  />
                </View>

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={handleReject}
                    style={styles.actionButton}
                    textColor={theme.colors.error}
                    loading={processing}
                  >
                    Reject
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleApprove}
                    style={styles.actionButton}
                    loading={processing}
                  >
                    Approve
                  </Button>
                </View>
              </Surface>
            )}
          </Modal>
        </Portal>

        <Snackbar
          visible={!!snackbarMessage}
          onDismiss={() => setSnackbarMessage('')}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </AdminRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionCount: {
    opacity: 0.7,
  },
  imageGrid: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  imageCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
  },
  imageInfo: {
    padding: 12,
  },
  imageSource: {
    opacity: 0.6,
    marginTop: 2,
  },
  imageDate: {
    opacity: 0.6,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    margin: 20,
    maxHeight: '90%',
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
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalInfo: {
    padding: 20,
  },
  modalMetadata: {
    opacity: 0.7,
    marginTop: 4,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 4,
  },
  customCategoryInput: {
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});