/**
 * Profile Screen — Apple-style grouped settings.
 *
 * Identity card on top (avatar + name + email). Six grouped inset sections:
 * You, Goal, Nutrition targets, Preferences, Motion, Account.
 * Half-sheet modals replace centered overlays. Sign-out is a destructive row.
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
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
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { UserProfile, AnimationIntensity, GoalType, TDEEResult } from '@/types';
import * as ProfileService from '@/services/profile-service';
import { getIntensityLabel, getIntensityDescription } from '@/utils/animationConfigs';
import { GoalTypeSelector } from '@/components/GoalTypeSelector';
import {
  calculateTDEE,
  logWeight,
  getWeightLogs,
  DEFAULT_PACE_KG_PER_WEEK,
  PACE_OPTIONS_KG_PER_WEEK,
} from '@/services/gamification-service';
import { designColors, fonts, space, radius, shadows, layout } from '@/constants/design';

type EditMode = 'goal' | 'physical' | 'target_weight' | null;

interface EditingData {
  type: EditMode;
  key: string;
  label: string;
  value: any;
  unit?: string;
  keyboardType?: 'number-pad' | 'decimal-pad';
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

// -----------------------------------------------------------------------------
// SettingsRow — local, monochrome icon variant
// -----------------------------------------------------------------------------

interface RowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string | null;
  rightComponent?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  c: typeof designColors.light;
}

function Row({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  rightComponent,
  onPress,
  showChevron,
  destructive,
  isFirst,
  isLast,
  c,
}: RowProps) {
  const labelColor = destructive ? c.error : c.text.primary;
  const computedIconBg = iconBg ?? (destructive ? '#FEE2E2' : c.accentTint);
  const computedIconColor = iconColor ?? (destructive ? c.error : c.accent);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        !isLast && { borderBottomWidth: layout.hairlineWidth, borderBottomColor: c.hairline },
        { backgroundColor: pressed && onPress ? c.bg.inset : c.bg.surface },
      ]}
    >
      {icon && (
        <View style={[styles.rowIconWrap, { backgroundColor: computedIconBg }]}>
          <Ionicons name={icon} size={17} color={computedIconColor} />
        </View>
      )}

      <Text
        style={[styles.rowLabel, { color: labelColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <View style={styles.rowRight}>
        {rightComponent ? (
          rightComponent
        ) : value !== undefined && value !== null ? (
          <Text style={[styles.rowValue, { color: c.text.tertiary }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={c.text.tertiary} style={{ marginLeft: 4 }} />
        )}
      </View>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Section header (uppercase tracked label above a card)
// -----------------------------------------------------------------------------

function SectionHeader({ children, c }: { children: string; c: typeof designColors.light }) {
  return (
    <Text style={[styles.sectionHeader, { color: c.text.secondary }]}>{children}</Text>
  );
}

function Group({ children, c }: { children: ReactNode; c: typeof designColors.light }) {
  return (
    <View style={[styles.group, { backgroundColor: c.bg.surface }]}>
      {children}
    </View>
  );
}

// -----------------------------------------------------------------------------
// Half-sheet modal primitive
// -----------------------------------------------------------------------------

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  c: typeof designColors.light;
}

function HalfSheet({ visible, onClose, title, children, c }: SheetProps) {
  const translate = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translate, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translate.setValue(SCREEN_HEIGHT);
      backdrop.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={handleClose}>
      <View style={styles.sheetWrap}>
        <Animated.View style={[styles.sheetBackdrop, { opacity: backdrop }]}>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContent,
            {
              backgroundColor: c.bg.surface,
              transform: [{ translateY: translate }],
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: c.text.tertiary }]} />
          <Text style={[styles.sheetTitle, { color: c.text.primary }]}>{title}</Text>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Profile screen
// -----------------------------------------------------------------------------

export default function ProfileScreen() {
  const colorScheme = useTheme();
  const c = designColors[colorScheme];
  const { user, signOut } = useAuth();
  const { state, updateSettings, updateAnimationSettings } = useApp();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState<EditingData | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [tdeeResult, setTdeeResult] = useState<TDEEResult | null>(null);
  const [lastLoggedWeight, setLastLoggedWeight] = useState<number | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showDietSheet, setShowDietSheet] = useState(false);
  const [showPaceSheet, setShowPaceSheet] = useState(false);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [tdeeExpanded, setTdeeExpanded] = useState(false);

  const tdeeOpts = (p: Partial<UserProfile> | null) => ({
    target_weight_kg: p?.target_weight_kg,
    pace_kg_per_week: p?.pace_kg_per_week ?? DEFAULT_PACE_KG_PER_WEEK,
  });

  const recomputeAndPersistGoal = async (updated: UserProfile, silent = false) => {
    const goalType = updated.goal_type ?? 'maintenance';
    const tdee = calculateTDEE(updated, goalType, tdeeOpts(updated));
    const prev = state.settings.dailyCalorieGoal;
    await ProfileService.updateUserProfile({ daily_calorie_goal: tdee.recommendedCalories });
    setProfile({ ...updated, daily_calorie_goal: tdee.recommendedCalories });
    setTdeeResult(tdee);
    updateSettings({ dailyCalorieGoal: tdee.recommendedCalories });
    if (!silent && prev !== tdee.recommendedCalories) {
      Toast.show({
        type: 'success',
        text1: 'Calorie target updated',
        text2: `${tdee.recommendedCalories} cal/day`,
        position: 'top',
        visibilityTime: 2200,
      });
    }
    return tdee;
  };

  useEffect(() => {
    loadProfile();
    loadLastWeight();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await ProfileService.getUserProfile();
      setProfile(userProfile);
      if (userProfile) {
        const goalType = userProfile.goal_type ?? 'maintenance';
        setTdeeResult(calculateTDEE(userProfile, goalType, tdeeOpts(userProfile)));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadLastWeight = async () => {
    try {
      const logs = await getWeightLogs(1);
      if (logs.length > 0) setLastLoggedWeight(logs[logs.length - 1].weight_kg);
    } catch {
      // non-critical
    }
  };

  const handleGoalTypeChange = async (goalType: GoalType) => {
    try {
      await ProfileService.updateUserProfile({ goal_type: goalType });
      const updated = { ...profile, goal_type: goalType } as UserProfile;
      await recomputeAndPersistGoal(updated);
    } catch {
      Alert.alert('Error', 'Failed to update goal type');
    }
  };

  const handlePaceChange = async (pace: number) => {
    setShowPaceSheet(false);
    try {
      await ProfileService.updateUserProfile({ pace_kg_per_week: pace });
      const updated = { ...profile, pace_kg_per_week: pace } as UserProfile;
      await recomputeAndPersistGoal(updated);
    } catch {
      Alert.alert('Error', 'Failed to update pace');
    }
  };

  const handleActivityChange = async (
    activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  ) => {
    setShowActivitySheet(false);
    try {
      await ProfileService.updateUserProfile({ activity_level });
      const updated = { ...profile, activity_level } as UserProfile;
      await recomputeAndPersistGoal(updated);
    } catch {
      Alert.alert('Error', 'Failed to update activity level');
    }
  };

  const handleSave = async () => {
    if (!editingData) return;

    if (editingData.type === 'goal') {
      const newValue = parseInt(tempValue, 10);
      if (isNaN(newValue) || newValue <= 0) {
        Alert.alert('Invalid Value', 'Please enter a valid positive number');
        return;
      }
      updateSettings({ [editingData.key]: newValue });
    } else if (editingData.type === 'physical') {
      try {
        const isDecimal = editingData.keyboardType === 'decimal-pad';
        const newValue = isDecimal ? parseFloat(tempValue) : parseInt(tempValue, 10);
        if (isNaN(newValue) || newValue <= 0) {
          Alert.alert('Invalid Value', 'Please enter a valid positive number');
          return;
        }
        await ProfileService.updatePhysicalStats({ [editingData.key]: newValue });
        const updated = { ...profile, [editingData.key]: newValue } as UserProfile;
        await recomputeAndPersistGoal(updated);
      } catch {
        Alert.alert('Error', 'Failed to update profile');
      }
    } else if (editingData.type === 'target_weight') {
      const parsed = parseFloat(tempValue);
      if (isNaN(parsed) || parsed <= 0) {
        Alert.alert('Invalid Value', 'Please enter a valid weight in kg');
        return;
      }
      try {
        await ProfileService.updateGoalType(profile?.goal_type ?? 'maintenance', parsed);
        const updated = { ...profile, target_weight_kg: parsed } as UserProfile;
        await recomputeAndPersistGoal(updated);
      } catch {
        Alert.alert('Error', 'Failed to update target weight');
      }
    }

    setEditingData(null);
  };

  const handleLogWeight = async () => {
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Value', 'Please enter a valid weight in kg');
      return;
    }
    try {
      await logWeight(parsed);
      setLastLoggedWeight(parsed);
      setShowWeightModal(false);
      setWeightInput('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log weight');
    }
  };

  const handleGenderChange = async (gender: 'male' | 'female' | 'other' | 'prefer_not_to_say') => {
    setShowGenderSheet(false);
    try {
      await ProfileService.updatePhysicalStats({ gender });
      const updated = { ...profile, gender } as UserProfile;
      await recomputeAndPersistGoal(updated);
    } catch {
      Alert.alert('Error', 'Failed to update gender');
    }
  };

  const handleDietChange = async (dietary_preference: string) => {
    setShowDietSheet(false);
    try {
      await ProfileService.updateDietaryPreferences({ dietary_preference: dietary_preference as any });
      await loadProfile();
    } catch {
      Alert.alert('Error', 'Failed to update diet');
    }
  };

  const handleTogglePreference = async (key: string, value: boolean) => {
    try {
      await ProfileService.updateAppPreferences({ [key]: value as any });
      await loadProfile();
    } catch {
      Alert.alert('Error', 'Failed to update preference');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg.canvas }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = (() => {
    const email = profile?.email || user?.email || '';
    if (!email) return '?';
    const before = email.split('@')[0];
    const parts = before.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return before.slice(0, 2).toUpperCase();
  })();

  const displayName = profile?.email?.split('@')[0] ?? user?.email?.split('@')[0] ?? 'You';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg.canvas }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: c.text.primary }]}>Profile</Text>

        {/* Identity card */}
        <View style={[styles.identityCard, { backgroundColor: c.bg.surface }]}>
          <View style={[styles.avatar, { backgroundColor: c.accentTint }]}>
            <Text style={[styles.avatarInitials, { color: c.accent }]}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.identityName, { color: c.text.primary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.identityEmail, { color: c.text.secondary }]} numberOfLines={1}>
              {profile?.email || user?.email}
            </Text>
          </View>
        </View>

        {/* You */}
        <SectionHeader c={c}>You</SectionHeader>
        <Group c={c}>
          <Row
            c={c}
            icon="resize-outline"
            label="Height"
            value={profile?.height_cm ? `${profile.height_cm} cm` : 'Not set'}
            onPress={() => {
              setEditingData({ type: 'physical', key: 'height_cm', label: 'Height', value: profile?.height_cm || 170, unit: 'cm', keyboardType: 'number-pad' });
              setTempValue((profile?.height_cm ?? 170).toString());
            }}
            showChevron
            isFirst
          />
          <Row
            c={c}
            icon="scale-outline"
            label="Weight"
            value={profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
            onPress={() => {
              setEditingData({ type: 'physical', key: 'weight_kg', label: 'Weight', value: profile?.weight_kg || 70, unit: 'kg', keyboardType: 'decimal-pad' });
              setTempValue((profile?.weight_kg ?? 70).toString());
            }}
            showChevron
          />
          <Row
            c={c}
            icon="calendar-outline"
            label="Age"
            value={profile?.age ? `${profile.age}` : 'Not set'}
            onPress={() => {
              setEditingData({ type: 'physical', key: 'age', label: 'Age', value: profile?.age || 25, unit: 'years', keyboardType: 'number-pad' });
              setTempValue((profile?.age ?? 25).toString());
            }}
            showChevron
          />
          <Row
            c={c}
            icon="person-outline"
            label="Gender"
            value={profile?.gender ? profile.gender.replace('_', ' ') : 'Not set'}
            onPress={() => setShowGenderSheet(true)}
            showChevron
          />
          <Row
            c={c}
            icon="restaurant-outline"
            label="Diet"
            value={profile?.dietary_preference || 'None'}
            onPress={() => setShowDietSheet(true)}
            showChevron
            isLast
          />
        </Group>

        {/* Goal */}
        <SectionHeader c={c}>Goal</SectionHeader>
        <View style={[styles.goalCard, { backgroundColor: c.bg.surface }]}>
          <GoalTypeSelector
            selected={profile?.goal_type ?? 'maintenance'}
            onSelect={handleGoalTypeChange}
            primaryColor={c.accent}
            secondaryColor={c.accentTint}
            borderColor={c.hairline}
            cardBackground={c.bg.surface}
            textColor={c.text.primary}
            textSecondaryColor={c.text.secondary}
          />
        </View>

        <Group c={c}>
          <Row
            c={c}
            icon="flag-outline"
            label="Target weight"
            value={profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : 'Not set'}
            onPress={() => {
              setEditingData({ type: 'target_weight', key: 'target_weight_kg', label: 'Target weight', value: profile?.target_weight_kg || 70, unit: 'kg', keyboardType: 'decimal-pad' });
              setTempValue(profile?.target_weight_kg?.toString() ?? '');
            }}
            showChevron
            isFirst
          />
          {(profile?.goal_type === 'weight_loss' || profile?.goal_type === 'weight_gain') && (
            <Row
              c={c}
              icon="speedometer-outline"
              label="Weekly pace"
              value={`${profile?.pace_kg_per_week ?? DEFAULT_PACE_KG_PER_WEEK} kg/wk`}
              onPress={() => setShowPaceSheet(true)}
              showChevron
            />
          )}
          <Row
            c={c}
            icon="walk-outline"
            label="Activity level"
            value={(profile?.activity_level ?? 'moderate').replace('_', ' ')}
            onPress={() => setShowActivitySheet(true)}
            showChevron
          />
          <Row
            c={c}
            icon="trending-up-outline"
            label="Log today's weight"
            value={lastLoggedWeight ? `Last: ${lastLoggedWeight} kg` : 'Tap to log'}
            onPress={() => {
              setWeightInput(lastLoggedWeight?.toString() ?? '');
              setShowWeightModal(true);
            }}
            showChevron
            isLast
          />
        </Group>

        {/* TDEE Info card — collapsible */}
        {tdeeResult && (
          <Pressable
            onPress={() => setTdeeExpanded(!tdeeExpanded)}
            style={[styles.tdeeCard, { backgroundColor: c.accentTint }]}
          >
            <View style={styles.tdeeHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tdeeKicker, { color: c.accent }]}>RECOMMENDED</Text>
                <Text style={[styles.tdeeNumber, { color: c.accent }]}>
                  {tdeeResult.recommendedCalories.toLocaleString()}
                  <Text style={styles.tdeeUnit}> cal/day</Text>
                </Text>
              </View>
              <Ionicons
                name={tdeeExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={c.accent}
              />
            </View>
            {tdeeExpanded && (
              <View style={styles.tdeeBody}>
                <Text style={[styles.tdeeText, { color: c.text.primary }]}>
                  Your TDEE is ~{tdeeResult.tdee} cal/day
                  {tdeeResult.adjustment !== 0 && (
                    <Text style={{ color: c.text.secondary }}>
                      {'  '}({tdeeResult.adjustment > 0 ? '+' : ''}{tdeeResult.adjustment} for goal)
                    </Text>
                  )}
                </Text>
                {tdeeResult.weeksToGoal !== null && (
                  <Text style={[styles.tdeeText, { color: c.text.primary }]}>
                    ≈ {tdeeResult.weeksToGoal} weeks to reach {profile?.target_weight_kg} kg at {tdeeResult.paceKgPerWeek} kg/week
                  </Text>
                )}
                <Text style={[styles.tdeeHint, { color: c.text.secondary }]}>
                  Recalculates when you change weight, target, pace, activity, or goal.
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Nutrition targets */}
        <SectionHeader c={c}>Nutrition targets</SectionHeader>
        <Group c={c}>
          <Row
            c={c}
            icon="flame-outline"
            iconBg="#FEF3C7"
            iconColor="#D97706"
            label="Calories"
            value={`${state.settings.dailyCalorieGoal} cal`}
            onPress={() => {
              setEditingData({ type: 'goal', key: 'dailyCalorieGoal', label: 'Daily calories', value: state.settings.dailyCalorieGoal, unit: 'cal', keyboardType: 'number-pad' });
              setTempValue(state.settings.dailyCalorieGoal.toString());
            }}
            showChevron
            isFirst
          />
          <Row
            c={c}
            icon="fitness-outline"
            iconBg="#EEF2FF"
            iconColor={c.macro.protein}
            label="Protein"
            value={`${state.settings.targetProtein} g`}
            onPress={() => {
              setEditingData({ type: 'goal', key: 'targetProtein', label: 'Protein', value: state.settings.targetProtein, unit: 'g', keyboardType: 'number-pad' });
              setTempValue(state.settings.targetProtein.toString());
            }}
            showChevron
          />
          <Row
            c={c}
            icon="leaf-outline"
            iconBg="#FEF3C7"
            iconColor={c.macro.carbs}
            label="Carbs"
            value={`${state.settings.targetCarbs} g`}
            onPress={() => {
              setEditingData({ type: 'goal', key: 'targetCarbs', label: 'Carbs', value: state.settings.targetCarbs, unit: 'g', keyboardType: 'number-pad' });
              setTempValue(state.settings.targetCarbs.toString());
            }}
            showChevron
          />
          <Row
            c={c}
            icon="water-outline"
            iconBg="#D1FAE5"
            iconColor={c.macro.fat}
            label="Fat"
            value={`${state.settings.targetFat} g`}
            onPress={() => {
              setEditingData({ type: 'goal', key: 'targetFat', label: 'Fat', value: state.settings.targetFat, unit: 'g', keyboardType: 'number-pad' });
              setTempValue(state.settings.targetFat.toString());
            }}
            showChevron
            isLast
          />
        </Group>

        {/* Preferences */}
        <SectionHeader c={c}>Preferences</SectionHeader>
        <Group c={c}>
          <Row
            c={c}
            icon="moon-outline"
            label="Dark mode"
            rightComponent={
              <ToggleSwitch
                value={state.settings.darkMode}
                onValueChange={(v) => updateSettings({ darkMode: v })}
              />
            }
            isFirst
          />
          <Row
            c={c}
            icon="notifications-outline"
            label="Meal reminders"
            rightComponent={
              <ToggleSwitch
                value={profile?.meal_reminders || false}
                onValueChange={(v) => handleTogglePreference('meal_reminders', v)}
              />
            }
          />
          <Row
            c={c}
            icon="water-outline"
            label="Track water"
            rightComponent={
              <ToggleSwitch
                value={profile?.track_water || false}
                onValueChange={(v) => handleTogglePreference('track_water', v)}
              />
            }
            isLast
          />
        </Group>

        {/* Motion */}
        <SectionHeader c={c}>Motion</SectionHeader>
        <Group c={c}>
          <Row
            c={c}
            icon="sparkles-outline"
            label="Animation intensity"
            value={getIntensityLabel(state.animationSettings.intensity)}
            onPress={() => setShowIntensityPicker(true)}
            showChevron
            isFirst
          />
          <Row
            c={c}
            icon="phone-portrait-outline"
            label="Haptics"
            rightComponent={
              <ToggleSwitch
                value={state.animationSettings.haptics}
                onValueChange={(v) => updateAnimationSettings({ haptics: v })}
              />
            }
          />
          <Row
            c={c}
            icon="star-outline"
            label="Particle effects"
            rightComponent={
              <ToggleSwitch
                value={state.animationSettings.particles}
                onValueChange={(v) => updateAnimationSettings({ particles: v })}
              />
            }
            isLast
          />
        </Group>

        {/* Account */}
        <SectionHeader c={c}>Account</SectionHeader>
        <Group c={c}>
          <Row
            c={c}
            icon="information-circle-outline"
            label="App version"
            value="1.0.0"
            isFirst
          />
          <Row
            c={c}
            icon="help-circle-outline"
            label="Help & support"
            onPress={() => Alert.alert('Help', 'Support coming soon')}
            showChevron
          />
          <Row
            c={c}
            icon="log-out-outline"
            label="Sign out"
            onPress={handleSignOut}
            destructive
            isLast
          />
        </Group>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Animation Intensity sheet */}
      <HalfSheet
        visible={showIntensityPicker}
        onClose={() => setShowIntensityPicker(false)}
        title="Animation intensity"
        c={c}
      >
        <View style={{ gap: space[2] }}>
          {(['full', 'balanced', 'minimal', 'off'] as AnimationIntensity[]).map((intensity) => {
            const selected = state.animationSettings.intensity === intensity;
            return (
              <Pressable
                key={intensity}
                onPress={() => {
                  updateAnimationSettings({ intensity });
                  setShowIntensityPicker(false);
                }}
                style={({ pressed }) => [
                  styles.intensityRow,
                  {
                    backgroundColor: selected ? c.accentTint : c.bg.inset,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.intensityLabel, { color: selected ? c.accent : c.text.primary }]}>
                    {getIntensityLabel(intensity)}
                  </Text>
                  <Text style={[styles.intensityDesc, { color: c.text.secondary }]}>
                    {getIntensityDescription(intensity)}
                  </Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>
      </HalfSheet>

      {/* Gender sheet */}
      <HalfSheet
        visible={showGenderSheet}
        onClose={() => setShowGenderSheet(false)}
        title="Gender"
        c={c}
      >
        <View style={{ gap: space[2] }}>
          {([
            { key: 'male', label: 'Male' },
            { key: 'female', label: 'Female' },
            { key: 'other', label: 'Other' },
            { key: 'prefer_not_to_say', label: 'Prefer not to say' },
          ] as const).map((opt) => {
            const selected = profile?.gender === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => handleGenderChange(opt.key)}
                style={({ pressed }) => [
                  styles.intensityRow,
                  {
                    backgroundColor: selected ? c.accentTint : c.bg.inset,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.intensityLabel, { color: selected ? c.accent : c.text.primary }]}>
                  {opt.label}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>
      </HalfSheet>

      {/* Diet sheet */}
      <HalfSheet
        visible={showDietSheet}
        onClose={() => setShowDietSheet(false)}
        title="Diet"
        c={c}
      >
        <View style={{ gap: space[2] }}>
          {(['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'] as const).map((diet) => {
            const selected = profile?.dietary_preference === diet;
            return (
              <Pressable
                key={diet}
                onPress={() => handleDietChange(diet)}
                style={({ pressed }) => [
                  styles.intensityRow,
                  {
                    backgroundColor: selected ? c.accentTint : c.bg.inset,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.intensityLabel,
                    { color: selected ? c.accent : c.text.primary, textTransform: 'capitalize' },
                  ]}
                >
                  {diet}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>
      </HalfSheet>

      {/* Pace sheet */}
      <HalfSheet
        visible={showPaceSheet}
        onClose={() => setShowPaceSheet(false)}
        title="Weekly pace"
        c={c}
      >
        <View style={{ gap: space[2] }}>
          {PACE_OPTIONS_KG_PER_WEEK.map((opt) => {
            const current = profile?.pace_kg_per_week ?? DEFAULT_PACE_KG_PER_WEEK;
            const selected = Math.abs(current - opt) < 0.001;
            return (
              <Pressable
                key={opt}
                onPress={() => handlePaceChange(opt)}
                style={({ pressed }) => [
                  styles.intensityRow,
                  {
                    backgroundColor: selected ? c.accentTint : c.bg.inset,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.intensityLabel, { color: selected ? c.accent : c.text.primary }]}>
                  {opt} kg / week
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>
      </HalfSheet>

      {/* Activity level sheet */}
      <HalfSheet
        visible={showActivitySheet}
        onClose={() => setShowActivitySheet(false)}
        title="Activity level"
        c={c}
      >
        <View style={{ gap: space[2] }}>
          {([
            { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
            { key: 'light', label: 'Light', desc: '1–3 days/week' },
            { key: 'moderate', label: 'Moderate', desc: '3–5 days/week' },
            { key: 'active', label: 'Active', desc: '6–7 days/week' },
            { key: 'very_active', label: 'Very active', desc: 'Physical job or 2x/day' },
          ] as const).map((opt) => {
            const selected = (profile?.activity_level ?? 'moderate') === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => handleActivityChange(opt.key)}
                style={({ pressed }) => [
                  styles.intensityRow,
                  {
                    backgroundColor: selected ? c.accentTint : c.bg.inset,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.intensityLabel, { color: selected ? c.accent : c.text.primary }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.intensityDesc, { color: c.text.secondary }]}>
                    {opt.desc}
                  </Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>
      </HalfSheet>

      {/* Log weight sheet */}
      <HalfSheet
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        title="Log today's weight"
        c={c}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.sheetInput,
              { backgroundColor: c.bg.inset, color: c.text.primary, borderColor: c.hairline },
            ]}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="decimal-pad"
            autoFocus
            placeholder="70.0"
            placeholderTextColor={c.placeholder}
          />
          <Text style={[styles.unitText, { color: c.text.secondary }]}>kg</Text>
        </View>
        <View style={styles.sheetButtons}>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: c.bg.inset }]}
            onPress={() => setShowWeightModal(false)}
          >
            <Text style={[styles.sheetBtnText, { color: c.text.primary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: c.accent }]}
            onPress={handleLogWeight}
          >
            <Text style={[styles.sheetBtnText, { color: '#FFFFFF' }]}>Save</Text>
          </Pressable>
        </View>
      </HalfSheet>

      {/* Edit value sheet */}
      <HalfSheet
        visible={!!editingData}
        onClose={() => setEditingData(null)}
        title={editingData?.label ?? ''}
        c={c}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.sheetInput,
              { backgroundColor: c.bg.inset, color: c.text.primary, borderColor: c.hairline },
            ]}
            value={tempValue}
            onChangeText={setTempValue}
            keyboardType={editingData?.keyboardType ?? 'number-pad'}
            autoFocus
          />
          <Text style={[styles.unitText, { color: c.text.secondary }]}>{editingData?.unit}</Text>
        </View>
        <View style={styles.sheetButtons}>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: c.bg.inset }]}
            onPress={() => setEditingData(null)}
          >
            <Text style={[styles.sheetBtnText, { color: c.text.primary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: c.accent }]}
            onPress={handleSave}
          >
            <Text style={[styles.sheetBtnText, { color: '#FFFFFF' }]}>Save</Text>
          </Pressable>
        </View>
      </HalfSheet>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[6],
  },

  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: space[4],
    marginTop: space[2],
  },

  // Identity
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    borderRadius: radius.lg,
    marginBottom: space[5],
    ...shadows.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space[4],
  },
  avatarInitials: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  identityText: { flex: 1 },
  identityName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  identityEmail: { fontSize: 13, fontWeight: '400' },

  // Section
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: space[2],
    marginTop: space[4],
    marginLeft: space[4],
  },
  group: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
    shadowOpacity: 0.04,
    elevation: 2,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    paddingVertical: 12,
    minHeight: 52,
  },
  rowFirst: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  rowLast: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  rowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space[3],
  },
  rowLabel: { fontSize: 16, fontWeight: '500', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', marginLeft: space[2] },
  rowValue: { fontSize: 15, fontWeight: '500' },

  // Goal card
  goalCard: {
    borderRadius: radius.md,
    padding: space[3],
    marginBottom: space[3],
    ...shadows.card,
    shadowOpacity: 0.04,
    elevation: 2,
  },

  // TDEE collapsible
  tdeeCard: {
    borderRadius: radius.md,
    padding: space[4],
    marginTop: space[3],
  },
  tdeeHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  tdeeKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tdeeNumber: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  tdeeUnit: { fontSize: 14, fontWeight: '500', fontFamily: fonts.sans },
  tdeeBody: { marginTop: space[3], gap: space[3] },
  tdeeText: { fontSize: 14, lineHeight: 20 },
  tdeeHint: { fontSize: 13, lineHeight: 18 },

  // Sheet
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space[4],
    paddingBottom: space[5] + 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: space[3],
    opacity: 0.4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: space[4],
  },
  sheetInput: {
    flex: 1,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: fonts.serif,
    textAlign: 'center',
    borderWidth: layout.hairlineWidth,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space[4] },
  unitText: { fontSize: 17, fontWeight: '500', marginLeft: space[3] },
  sheetButtons: { flexDirection: 'row', gap: space[3] },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  sheetBtnText: { fontSize: 16, fontWeight: '600' },

  // Intensity / option rows
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    borderRadius: radius.sm,
  },
  intensityLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  intensityDesc: { fontSize: 13, fontWeight: '400' },
});
