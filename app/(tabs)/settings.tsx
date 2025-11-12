/**
 * Settings Screen - User settings and preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/contexts/AppContext';
import { COLORS, MACRO_EMOJIS } from '@/constants/mockData';
import { SettingsRow } from '@/components/SettingsRow';
import { ToggleSwitch } from '@/components/ToggleSwitch';

export default function SettingsScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];

  const { state, updateSettings } = useApp();
  const [editingGoal, setEditingGoal] = useState<{
    key: string;
    label: string;
    value: number;
    unit: string;
  } | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleEditGoal = (key: string, label: string, value: number, unit: string) => {
    setEditingGoal({ key, label, value, unit });
    setTempValue(value.toString());
  };

  const handleSaveGoal = () => {
    if (!editingGoal) return;

    const newValue = parseInt(tempValue, 10);
    if (isNaN(newValue) || newValue <= 0) {
      Alert.alert('Invalid Value', 'Please enter a valid positive number');
      return;
    }

    updateSettings({ [editingGoal.key]: newValue });
    setEditingGoal(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>Settings</Text>

        {/* Nutrition Goals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            NUTRITION GOALS
          </Text>

          <SettingsRow
            emoji={MACRO_EMOJIS.calories}
            label="Daily Calorie Goal"
            value={`${state.settings.dailyCalorieGoal} cal`}
            onPress={() =>
              handleEditGoal('dailyCalorieGoal', 'Daily Calorie Goal', state.settings.dailyCalorieGoal, 'cal')
            }
            showChevron
          />

          <SettingsRow
            emoji={MACRO_EMOJIS.protein}
            label="Target Protein"
            value={`${state.settings.targetProtein} g`}
            onPress={() =>
              handleEditGoal('targetProtein', 'Target Protein', state.settings.targetProtein, 'g')
            }
            showChevron
          />

          <SettingsRow
            emoji={MACRO_EMOJIS.carbs}
            label="Target Carbs"
            value={`${state.settings.targetCarbs} g`}
            onPress={() =>
              handleEditGoal('targetCarbs', 'Target Carbs', state.settings.targetCarbs, 'g')
            }
            showChevron
          />

          <SettingsRow
            emoji={MACRO_EMOJIS.fat}
            label="Target Fat"
            value={`${state.settings.targetFat} g`}
            onPress={() =>
              handleEditGoal('targetFat', 'Target Fat', state.settings.targetFat, 'g')
            }
            showChevron
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>

          <SettingsRow
            label="Dark Mode"
            rightComponent={
              <ToggleSwitch
                value={state.settings.darkMode}
                onValueChange={(value) => updateSettings({ darkMode: value })}
              />
            }
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>

          <SettingsRow
            label="App Version"
            value="1.0.0 (Phase 1)"
          />

          <SettingsRow
            label="Help & Support"
            onPress={() => Alert.alert('Help', 'Support coming in Phase 2+')}
            showChevron
          />
        </View>
      </ScrollView>

      {/* Edit Goal Modal */}
      <Modal visible={!!editingGoal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingGoal?.label}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType="number-pad"
                autoFocus
              />
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                {editingGoal?.unit}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setEditingGoal(null)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveGoal}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalInput: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
