import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  ActivityIndicator,
  FAB,
  List,
  Switch,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminRoute from '../../components/AdminRoute';
import { adminAPI } from '../../services/adminAPI';
import type { Schema } from '@/amplify/data/resource';

type Category = Schema['Category']['type'];

export default function CategoryManagement() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [categoryType, setCategoryType] = useState<'physical' | 'demographic' | 'style'>('physical');
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setDisplayName('');
    setCategoryType('physical');
    setOptions([]);
    setOptionInput('');
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setDisplayName(category.displayName);
    setCategoryType(category.type);
    setOptions(category.options || []);
    setOptionInput('');
    setModalVisible(true);
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setOptions(prev => [...prev, optionInput.trim()]);
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    if (options.length === 0) {
      Alert.alert('Error', 'At least one option is required');
      return;
    }

    setProcessing(true);

    try {
      if (editingCategory) {
        // Update existing category
        await adminAPI.updateCategory(editingCategory.categoryId, {
          displayName,
          options,
        });
        
        // Update local state
        setCategories(prev => 
          prev.map(cat => 
            cat.categoryId === editingCategory.categoryId
              ? { ...cat, displayName, options }
              : cat
          )
        );
      } else {
        // Create new category
        const newCategory = await adminAPI.createCategory(
          displayName,
          categoryType,
          options
        );
        
        if (newCategory) {
          setCategories(prev => [...prev, newCategory]);
        }
      }

      setModalVisible(false);
      Alert.alert('Success', editingCategory ? 'Category updated' : 'Category created');
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setProcessing(false);
    }
  };

  const toggleCategory = async (category: Category) => {
    try {
      await adminAPI.updateCategory(category.categoryId, {
        isActive: !category.isActive,
      });
      
      setCategories(prev =>
        prev.map(cat =>
          cat.categoryId === category.categoryId
            ? { ...cat, isActive: !cat.isActive }
            : cat
        )
      );
    } catch (error) {
      console.error('Failed to toggle category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const deleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.displayName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In production, this would call a delete API
              console.log('Delete category:', category.categoryId);
              
              setCategories(prev => 
                prev.filter(cat => cat.categoryId !== category.categoryId)
              );
              
              Alert.alert('Success', 'Category deleted');
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategory = (category: Category) => (
    <Surface key={category.categoryId} style={styles.categoryCard} elevation={1}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <Text variant="titleMedium">{category.displayName}</Text>
          <View style={styles.categoryMeta}>
            <Chip compact mode="flat" style={styles.typeChip}>
              {category.type}
            </Chip>
            <Text variant="labelSmall" style={styles.optionCount}>
              {category.options?.length || 0} options
            </Text>
          </View>
        </View>
        <Switch
          value={category.isActive}
          onValueChange={() => toggleCategory(category)}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.optionsList}>
        {category.options?.map((option, index) => (
          <Chip key={index} compact style={styles.optionChip}>
            {option}
          </Chip>
        ))}
      </View>

      <View style={styles.categoryActions}>
        <IconButton
          icon="pencil"
          size={20}
          onPress={() => openEditModal(category)}
        />
        <IconButton
          icon="delete"
          size={20}
          onPress={() => deleteCategory(category)}
          iconColor={theme.colors.error}
        />
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <AdminRoute>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium">Category Management</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {categories.length} categories configured
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="shape-outline"
                size={64}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                No categories yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Create your first category to start organizing content
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {categories.map(renderCategory)}
            </View>
          )}
        </ScrollView>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={openCreateModal}
        />

        {/* Create/Edit Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContent}
          >
            <Surface style={styles.modal} elevation={0}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setModalVisible(false)}
                />
              </View>

              <ScrollView style={styles.modalBody}>
                <TextInput
                  mode="outlined"
                  label="Display Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.input}
                />

                {!editingCategory && (
                  <View style={styles.typeSection}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      Category Type
                    </Text>
                    <SegmentedButtons
                      value={categoryType}
                      onValueChange={(value) => setCategoryType(value as any)}
                      buttons={[
                        { value: 'physical', label: 'Physical' },
                        { value: 'demographic', label: 'Demographic' },
                        { value: 'style', label: 'Style' },
                      ]}
                      style={styles.segmentedButtons}
                    />
                  </View>
                )}

                <View style={styles.optionsSection}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    Options
                  </Text>
                  
                  <View style={styles.optionInput}>
                    <TextInput
                      mode="outlined"
                      label="Add option"
                      value={optionInput}
                      onChangeText={setOptionInput}
                      onSubmitEditing={addOption}
                      style={styles.optionTextInput}
                      dense
                    />
                    <IconButton
                      icon="plus"
                      mode="contained"
                      onPress={addOption}
                      disabled={!optionInput.trim()}
                    />
                  </View>

                  <View style={styles.optionsPreview}>
                    {options.map((option, index) => (
                      <Chip
                        key={index}
                        onClose={() => removeOption(index)}
                        style={styles.optionChip}
                      >
                        {option}
                      </Chip>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <Divider />

              <View style={styles.modalActions}>
                <Button
                  mode="text"
                  onPress={() => setModalVisible(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={processing}
                  disabled={!displayName.trim() || options.length === 0}
                >
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>
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
    padding: 16,
    backgroundColor: 'white',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  categoriesList: {
    padding: 16,
    gap: 12,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typeChip: {
    height: 24,
  },
  optionCount: {
    opacity: 0.6,
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    marginBottom: 4,
  },
  categoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
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
    padding: 20,
    maxHeight: 400,
  },
  input: {
    marginBottom: 20,
  },
  typeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  optionsSection: {
    marginBottom: 20,
  },
  optionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  optionTextInput: {
    flex: 1,
  },
  optionsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
  },
});