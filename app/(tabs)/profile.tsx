/**
 * Profile Screen - User profile management and settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, MACRO_EMOJIS } from '@/constants/mockData';
import { SettingsRow } from '@/components/SettingsRow';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { UserProfile, AnimationIntensity } from '@/types';
import * as ProfileService from '@/services/profile-service';
import { getIntensityLabel, getIntensityDescription, getIntensityEmoji } from '@/utils/animationConfigs';

type EditMode = 'goal' | 'physical' | 'dietary' | null;

interface EditingData {
  type: EditMode;
  key: string;
  label: string;
  value: any;
  unit?: string;
}

export default function ProfileScreen() {
  const colorScheme = useTheme();
  const colors = COLORS[colorScheme];
  const { user } = useAuth();
  const { state, updateSettings, updateAnimationSettings } = useApp();
  const { signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState<EditingData | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await ProfileService.getUserProfile();
      setProfile(userProfile);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = (key: string, label: string, value: number, unit: string) => {
    setEditingData({ type: 'goal', key, label, value, unit });
    setTempValue(value.toString());
  };

  const handleEditPhysical = (key: string, label: string, value: number | string, unit?: string) => {
    setEditingData({ type: 'physical', key, label, value, unit });
    setTempValue(value?.toString() || '');
  };

  const handleSave = async () => {
    if (!editingData) return;

    if (editingData.type === 'goal') {
      // Save nutrition goal (existing logic)
      const newValue = parseInt(tempValue, 10);
      if (isNaN(newValue) || newValue <= 0) {
        Alert.alert('Invalid Value', 'Please enter a valid positive number');
        return;
      }
      updateSettings({ [editingData.key]: newValue });
    } else if (editingData.type === 'physical') {
      // Save physical stats
      try {
        const newValue = parseInt(tempValue, 10);
        if (isNaN(newValue) || newValue <= 0) {
          Alert.alert('Invalid Value', 'Please enter a valid positive number');
          return;
        }

        await ProfileService.updatePhysicalStats({ [editingData.key]: newValue });
        await loadProfile(); // Reload to show updated data
      } catch (error: any) {
        Alert.alert('Error', 'Failed to update profile');
      }
    }

    setEditingData(null);
  };

  const handleGenderChange = async (gender: 'male' | 'female' | 'other' | 'prefer_not_to_say') => {
    try {
      await ProfileService.updatePhysicalStats({ gender });
      await loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update gender');
    }
  };

  const handleTogglePreference = async (key: string, value: boolean) => {
    try {
      await ProfileService.updateAppPreferences({ [key]: value as any });
      await loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update preference');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const formatMemberSince = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>Profile</Text>

        {/* Profile Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACCOUNT
          </Text>

          <SettingsRow
            emoji="✉️"
            label="Email"
            value={profile?.email || user?.email || 'Not available'}
          />

          {profile?.created_at && (
            <SettingsRow
              emoji="📅"
              label="Member Since"
              value={formatMemberSince(profile.created_at)}
            />
          )}
        </View>

        {/* Physical Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PHYSICAL STATS
          </Text>

          <SettingsRow
            emoji="📏"
            label="Height"
            value={profile?.height_cm ? `${profile.height_cm} cm` : 'Not set'}
            onPress={() => handleEditPhysical('height_cm', 'Height', profile?.height_cm || 170, 'cm')}
            showChevron
          />

          <SettingsRow
            emoji="⚖️"
            label="Weight"
            value={profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
            onPress={() => handleEditPhysical('weight_kg', 'Weight', profile?.weight_kg || 70, 'kg')}
            showChevron
          />

          <SettingsRow
            emoji="🎂"
            label="Age"
            value={profile?.age ? `${profile.age} years` : 'Not set'}
            onPress={() => handleEditPhysical('age', 'Age', profile?.age || 25, 'years')}
            showChevron
          />

          <SettingsRow
            emoji="👤"
            label="Gender"
            value={profile?.gender ? profile.gender.replace('_', ' ') : 'Not set'}
            onPress={() =>
              Alert.alert('Select Gender', '', [
                { text: 'Male', onPress: () => handleGenderChange('male') },
                { text: 'Female', onPress: () => handleGenderChange('female') },
                { text: 'Other', onPress: () => handleGenderChange('other') },
                { text: 'Prefer not to say', onPress: () => handleGenderChange('prefer_not_to_say') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            showChevron
          />
        </View>

        {/* Dietary Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DIETARY PREFERENCES
          </Text>

          <SettingsRow
            emoji="🥗"
            label="Diet Type"
            value={profile?.dietary_preference || 'None'}
            onPress={() =>
              Alert.alert('Select Diet Type', '', [
                { text: 'None', onPress: async () => {
                  await ProfileService.updateDietaryPreferences({ dietary_preference: 'none' });
                  loadProfile();
                } },
                { text: 'Vegetarian', onPress: async () => {
                  await ProfileService.updateDietaryPreferences({ dietary_preference: 'vegetarian' });
                  loadProfile();
                } },
                { text: 'Vegan', onPress: async () => {
                  await ProfileService.updateDietaryPreferences({ dietary_preference: 'vegan' });
                  loadProfile();
                } },
                { text: 'Pescatarian', onPress: async () => {
                  await ProfileService.updateDietaryPreferences({ dietary_preference: 'pescatarian' });
                  loadProfile();
                } },
                { text: 'Keto', onPress: async () => {
                  await ProfileService.updateDietaryPreferences({ dietary_preference: 'keto' });
                  loadProfile();
                } },
                { text: 'Paleo', onPress: async () => {
                  await ProfileService.updateDietaryPreferences({ dietary_preference: 'paleo' });
                  loadProfile();
                } },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            showChevron
          />

          <SettingsRow
            emoji="⚠️"
            label="Allergies"
            value={profile?.allergies?.length ? profile.allergies.join(', ') : 'None'}
            onPress={() => Alert.alert('Allergies', 'Allergy management coming soon!')}
            showChevron
          />
        </View>

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

        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APP PREFERENCES</Text>

          <SettingsRow
            emoji="🌙"
            label="Dark Mode"
            rightComponent={
              <ToggleSwitch
                value={state.settings.darkMode}
                onValueChange={(value) => updateSettings({ darkMode: value })}
              />
            }
          />

          <SettingsRow
            emoji="🔔"
            label="Meal Reminders"
            rightComponent={
              <ToggleSwitch
                value={profile?.meal_reminders || false}
                onValueChange={(value) => handleTogglePreference('meal_reminders', value)}
              />
            }
          />

          <SettingsRow
            emoji="💧"
            label="Track Water"
            rightComponent={
              <ToggleSwitch
                value={profile?.track_water || false}
                onValueChange={(value) => handleTogglePreference('track_water', value)}
              />
            }
          />
        </View>

        {/* Animation Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ANIMATION PREFERENCES
          </Text>

          <SettingsRow
            emoji={getIntensityEmoji(state.animationSettings.intensity)}
            label="Animation Intensity"
            value={getIntensityLabel(state.animationSettings.intensity)}
            onPress={() => setShowIntensityPicker(true)}
            showChevron
          />

          <SettingsRow
            emoji="📳"
            label="Haptic Feedback"
            rightComponent={
              <ToggleSwitch
                value={state.animationSettings.haptics}
                onValueChange={(value) => updateAnimationSettings({ haptics: value })}
              />
            }
          />

          <SettingsRow
            emoji="✨"
            label="Particle Effects"
            rightComponent={
              <ToggleSwitch
                value={state.animationSettings.particles}
                onValueChange={(value) => updateAnimationSettings({ particles: value })}
              />
            }
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>

          <SettingsRow
            emoji="ℹ️"
            label="App Version"
            value="1.0.0 (Phase 1)"
          />

          <SettingsRow
            emoji="❓"
            label="Help & Support"
            onPress={() => Alert.alert('Help', 'Support coming in Phase 2+')}
            showChevron
          />
        </View>

        {/* Sign Out Button */}
        <Pressable
          style={[styles.signOutButton, { backgroundColor: colors.error || '#FF6B6B' }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        {/* Bottom spacing for floating tab bar */}
        <View style={{ height: Platform.OS === 'android' ? 130 : 120 }} />
      </ScrollView>

      {/* Animation Intensity Picker Modal */}
      <Modal visible={showIntensityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Animation Intensity
            </Text>

            <View style={styles.intensityOptions}>
              {(['full', 'balanced', 'minimal', 'off'] as AnimationIntensity[]).map((intensity) => (
                <Pressable
                  key={intensity}
                  style={[
                    styles.intensityOption,
                    { 
                      backgroundColor: state.animationSettings.intensity === intensity 
                        ? colors.primary 
                        : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => {
                    updateAnimationSettings({ intensity });
                    setShowIntensityPicker(false);
                  }}
                >
                  <Text style={styles.intensityEmoji}>{getIntensityEmoji(intensity)}</Text>
                  <Text style={[
                    styles.intensityLabel,
                    { 
                      color: state.animationSettings.intensity === intensity 
                        ? '#FFFFFF' 
                        : colors.text 
                    }
                  ]}>
                    {getIntensityLabel(intensity)}
                  </Text>
                  <Text style={[
                    styles.intensityDescription,
                    { 
                      color: state.animationSettings.intensity === intensity 
                        ? 'rgba(255, 255, 255, 0.8)' 
                        : colors.textSecondary 
                    }
                  ]}>
                    {getIntensityDescription(intensity)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.border, marginTop: 16 }]}
              onPress={() => setShowIntensityPicker(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingData} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingData?.label}
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
                {editingData?.unit}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setEditingData(null)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  signOutButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  intensityOptions: {
    gap: 12,
  },
  intensityOption: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  intensityEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  intensityLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  intensityDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
});
