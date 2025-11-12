/**
 * NutritionDetailsModal - Detailed nutrition information modal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/mockData';
import { MealEntry } from '@/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SourceIcons } from '@/components/SourceIcon';

interface NutritionDetailsModalProps {
  visible: boolean;
  meal: MealEntry | null;
  onClose: () => void;
  onUpdate?: (updates: Partial<MealEntry>) => void;
}

export const NutritionDetailsModal: React.FC<NutritionDetailsModalProps> = ({
  visible,
  meal,
  onClose,
  onUpdate,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme ?? 'light'];

  const [isEditing, setIsEditing] = useState(false);
  const [editedCalories, setEditedCalories] = useState('');
  const [editedProtein, setEditedProtein] = useState('');
  const [editedCarbs, setEditedCarbs] = useState('');
  const [editedFat, setEditedFat] = useState('');

  if (!meal) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedCalories(meal.calories.toString());
    setEditedProtein((meal.protein || 0).toString());
    setEditedCarbs((meal.carbs || 0).toString());
    setEditedFat((meal.fat || 0).toString());
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        calories: parseInt(editedCalories, 10) || meal.calories,
        protein: parseInt(editedProtein, 10) || meal.protein,
        carbs: parseInt(editedCarbs, 10) || meal.carbs,
        fat: parseInt(editedFat, 10) || meal.fat,
      });
    }
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Use AI explanation from meal or fallback to default
  const aiExplanation = meal.aiExplanation ||
    `Analyzed "${meal.text}" and estimated ${meal.calories} calories based on standard portion sizes and nutrition databases.`;

  // Check if there's an error
  const hasError = !!meal.error;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              Nutrition Details
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color="#000000" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Meal Name */}
            <Text style={[styles.mealName, { color: '#000000' }]}>
              {meal.text}
            </Text>

            {/* Calories */}
            <View style={styles.caloriesContainer}>
              {isEditing ? (
                <View style={styles.editRow}>
                  <Text style={styles.editLabel}>Calories:</Text>
                  <TextInput
                    style={[styles.editInput, { borderColor: colors.border }]}
                    value={editedCalories}
                    onChangeText={setEditedCalories}
                    keyboardType="number-pad"
                  />
                </View>
              ) : (
                <>
                  <Text style={styles.calorieEmoji}>🔥</Text>
                  <Text style={styles.calorieNumber}>{meal.calories}</Text>
                  <Text style={styles.calorieLabel}>total calories</Text>
                </>
              )}
            </View>

            {/* Macros */}
            <View style={styles.macrosContainer}>
              {isEditing ? (
                <>
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Protein (g):</Text>
                    <TextInput
                      style={[styles.editInput, { borderColor: colors.border }]}
                      value={editedProtein}
                      onChangeText={setEditedProtein}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Carbs (g):</Text>
                    <TextInput
                      style={[styles.editInput, { borderColor: colors.border }]}
                      value={editedCarbs}
                      onChangeText={setEditedCarbs}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Fat (g):</Text>
                    <TextInput
                      style={[styles.editInput, { borderColor: colors.border }]}
                      value={editedFat}
                      onChangeText={setEditedFat}
                      keyboardType="number-pad"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.macroCard}>
                    <Text style={styles.macroValue}>{meal.protein || 0}.0 g</Text>
                    <View style={styles.macroLabelRow}>
                      <View style={[styles.macroDot, { backgroundColor: '#FFD93D' }]} />
                      <Text style={styles.macroLabel}>Protein</Text>
                    </View>
                  </View>

                  <View style={styles.macroCard}>
                    <Text style={styles.macroValue}>{meal.carbs || 0}.0 g</Text>
                    <View style={styles.macroLabelRow}>
                      <View style={[styles.macroDot, { backgroundColor: '#FF6B6B' }]} />
                      <Text style={styles.macroLabel}>Carbs</Text>
                    </View>
                  </View>

                  <View style={styles.macroCard}>
                    <Text style={styles.macroValue}>{meal.fat || 0}.0 g</Text>
                    <View style={styles.macroLabelRow}>
                      <View style={[styles.macroDot, { backgroundColor: '#4ECDC4' }]} />
                      <Text style={styles.macroLabel}>Fat</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Items Section */}
            {!isEditing && (
              <>
                <Text style={[styles.sectionTitle, { color: '#666666' }]}>Items</Text>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemText, { color: '#000000' }]}>
                    {meal.text}
                  </Text>
                  <Text style={[styles.itemCalories, { color: '#666666' }]}>
                    {meal.calories} cal
                  </Text>
                </View>

                {/* Error Message (if any) */}
                {hasError && (
                  <>
                    <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>
                      Analysis Error
                    </Text>
                    <View style={[styles.aiContainer, { backgroundColor: '#FFF0F0' }]}>
                      <Text style={styles.aiEmoji}>⚠️</Text>
                      <Text style={[styles.aiText, { color: '#FF6B6B' }]}>
                        {meal.error}
                      </Text>
                    </View>
                  </>
                )}

                {/* AI Thought Process */}
                {!hasError && (
                  <>
                    <Text style={[styles.sectionTitle, { color: '#666666' }]}>
                      AI Analysis
                    </Text>
                    <View style={styles.aiContainer}>
                      <Text style={styles.aiEmoji}>🧠</Text>
                      <Text style={[styles.aiText, { color: '#666666' }]}>
                        {aiExplanation}
                      </Text>
                    </View>

                    {/* Confidence Score */}
                    {meal.confidence !== undefined && (
                      <View style={styles.confidenceContainer}>
                        <Text style={[styles.confidenceLabel, { color: '#666666' }]}>
                          Confidence: {Math.round(meal.confidence * 100)}%
                        </Text>
                      </View>
                    )}

                    {/* Sources - Visual Icons */}
                    {meal.sources && meal.sources.length > 0 && (
                      <>
                        <Text style={[styles.sectionTitle, { color: '#666666' }]}>
                          Data Sources
                        </Text>
                        <View style={styles.sourcesIconsContainer}>
                          <SourceIcons sources={meal.sources} size={32} />
                        </View>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {isEditing ? (
                <>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={[styles.button, styles.editButton, { borderColor: colors.primary }]}
                  onPress={handleEdit}
                >
                  <Text style={[styles.editButtonText, { color: colors.primary }]}>
                    Edit Nutrition
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  caloriesContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemCalories: {
    fontSize: 16,
  },
  aiContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginBottom: 24,
  },
  aiEmoji: {
    fontSize: 24,
  },
  aiText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButton: {
    borderWidth: 0,
    backgroundColor: '#EBF5FB',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    flex: 1,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    width: 120,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  confidenceContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  sourcesIconsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginBottom: 16,
  },
});
