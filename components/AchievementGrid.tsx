import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Modal } from 'react-native';
import { AchievementWithStatus } from '@/types';
import { fonts, space, radius } from '@/constants/design';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 40;
const GRID_GAP = 12;
const CARD_SIZE = (SCREEN_WIDTH - GRID_PADDING - GRID_GAP) / 2;

// Rarity by category — three explicit tiers (bronze / silver / gold)
const RARITY: Record<string, { ring: string; label: string }> = {
  consistency: { ring: '#CD7F32', label: 'Bronze' },
  goal:        { ring: '#9CA3AF', label: 'Silver' },
  nutrition:   { ring: '#9CA3AF', label: 'Silver' },
  streak:      { ring: '#D4A017', label: 'Gold' },
};

interface AchievementGridProps {
  achievements: AchievementWithStatus[];
  cardBackground: string;
  textColor: string;
  textSecondaryColor: string;
  primaryColor: string;
}

interface AchievementCardProps {
  achievement: AchievementWithStatus;
  cardBackground: string;
  textColor: string;
  textSecondaryColor: string;
  onPress: (a: AchievementWithStatus) => void;
}

function AchievementCard({
  achievement,
  cardBackground,
  textColor,
  textSecondaryColor,
  onPress,
}: AchievementCardProps) {
  const scaleAnim = useRef(new Animated.Value(achievement.unlocked ? 1 : 0.96)).current;
  const prevUnlocked = useRef(achievement.unlocked);

  useEffect(() => {
    if (achievement.unlocked && !prevUnlocked.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true, tension: 250, friction: 6 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
      ]).start();
    }
    prevUnlocked.current = achievement.unlocked;
  }, [achievement.unlocked, scaleAnim]);

  const rarity = RARITY[achievement.category] ?? { ring: '#9CA3AF', label: 'Silver' };

  return (
    <Pressable onPress={() => onPress(achievement)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Animated.View
        style={[
          styles.card,
          {
            width: CARD_SIZE,
            height: CARD_SIZE,
            backgroundColor: cardBackground,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Rarity ring around emoji */}
        <View
          style={[
            styles.emojiRing,
            {
              borderColor: achievement.unlocked ? rarity.ring : '#E5E7EB',
              backgroundColor: achievement.unlocked ? `${rarity.ring}14` : '#F3F4F6',
            },
          ]}
        >
          <Text style={[styles.emoji, !achievement.unlocked && styles.lockedEmoji]}>
            {achievement.emoji}
          </Text>
          {!achievement.unlocked && (
            <View style={styles.lockBadge}>
              <Text style={styles.lockGlyph}>🔒</Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.title, { color: achievement.unlocked ? textColor : textSecondaryColor }]}
          numberOfLines={2}
        >
          {achievement.title}
        </Text>
        <Text
          style={[styles.tier, { color: achievement.unlocked ? rarity.ring : textSecondaryColor }]}
        >
          {rarity.label}
        </Text>

        {!achievement.unlocked && typeof achievement.progress === 'number' && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(Math.max(0, Math.min(achievement.progress, 1)) * 100)}%`,
                    backgroundColor: rarity.ring,
                  },
                ]}
              />
            </View>
            {achievement.progressLabel ? (
              <Text style={[styles.progressLabel, { color: textSecondaryColor }]}>
                {achievement.progressLabel}
              </Text>
            ) : null}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function AchievementGrid({
  achievements,
  cardBackground,
  textColor,
  textSecondaryColor,
}: AchievementGridProps) {
  const [selected, setSelected] = useState<AchievementWithStatus | null>(null);

  return (
    <>
      <View style={styles.grid}>
        {achievements.map((a) => (
          <AchievementCard
            key={a.id}
            achievement={a}
            cardBackground={cardBackground}
            textColor={textColor}
            textSecondaryColor={textSecondaryColor}
            onPress={setSelected}
          />
        ))}
      </View>

      <AchievementSheet
        achievement={selected}
        onClose={() => setSelected(null)}
        cardBackground={cardBackground}
        textColor={textColor}
        textSecondaryColor={textSecondaryColor}
      />
    </>
  );
}

// ---------- Bottom sheet ----------

function AchievementSheet({
  achievement,
  onClose,
  cardBackground,
  textColor,
  textSecondaryColor,
}: {
  achievement: AchievementWithStatus | null;
  onClose: () => void;
  cardBackground: string;
  textColor: string;
  textSecondaryColor: string;
}) {
  const slide = useRef(new Animated.Value(0)).current;
  const visible = !!achievement;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 1 : 0,
      damping: 18,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!achievement) return null;

  const rarity = RARITY[achievement.category] ?? { ring: '#9CA3AF', label: 'Silver' };
  const date = achievement.unlocked && achievement.unlocked_at
    ? new Date(achievement.unlocked_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  const backdropOpacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: cardBackground, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.sheetHandle} />
        <View
          style={[
            styles.sheetEmojiRing,
            { borderColor: achievement.unlocked ? rarity.ring : '#E5E7EB' },
          ]}
        >
          <Text style={styles.sheetEmoji}>{achievement.emoji}</Text>
        </View>
        <Text style={[styles.sheetTitle, { color: textColor }]}>{achievement.title}</Text>
        <Text style={[styles.sheetTier, { color: rarity.ring }]}>{rarity.label}</Text>
        <Text style={[styles.sheetDescription, { color: textSecondaryColor }]}>
          {achievement.description}
        </Text>
        {date ? (
          <Text style={[styles.sheetDate, { color: textSecondaryColor }]}>Unlocked on {date}</Text>
        ) : (
          <>
            {typeof achievement.progress === 'number' && (
              <View style={styles.sheetProgressWrap}>
                <View style={styles.sheetProgressTrack}>
                  <View
                    style={[
                      styles.sheetProgressFill,
                      {
                        width: `${Math.round(Math.max(0, Math.min(achievement.progress, 1)) * 100)}%`,
                        backgroundColor: rarity.ring,
                      },
                    ]}
                  />
                </View>
                {achievement.progressLabel ? (
                  <Text style={[styles.sheetProgressLabel, { color: textSecondaryColor }]}>
                    {achievement.progressLabel}
                  </Text>
                ) : null}
              </View>
            )}
            <Text style={[styles.sheetDate, { color: textSecondaryColor }]}>
              Keep going — you&apos;ll unlock this soon.
            </Text>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  emoji: {
    fontSize: 36,
  },
  lockedEmoji: {
    opacity: 0.35,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lockGlyph: {
    fontSize: 11,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  tier: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  progressRow: {
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 2,
    alignItems: 'stretch',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  sheetProgressWrap: {
    width: '100%',
    paddingHorizontal: space[2],
    marginBottom: space[3],
  },
  sheetProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sheetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sheetProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  // Sheet
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[6],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: space[4],
  },
  sheetEmojiRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
  },
  sheetEmoji: {
    fontSize: 48,
  },
  sheetTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sheetTier: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: space[1],
    marginBottom: space[3],
  },
  sheetDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: space[3],
  },
  sheetDate: {
    fontSize: 13,
    fontWeight: '500',
  },
});
