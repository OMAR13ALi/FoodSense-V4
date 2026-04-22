import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WEIGHT_MILESTONE_LABELS, WEIGHT_MILESTONE_EMOJIS, GoalType } from '@/types';
import { fonts } from '@/constants/design';

function getSubtitle(goalType?: GoalType): string {
  switch (goalType) {
    case 'weight_loss':
      return "You're closer to your goal weight!";
    case 'maintenance':
      return "You're staying on track!";
    case 'weight_gain':
    case 'muscle_gain':
      return 'Great progress toward your target!';
    default:
      return "You're crushing your weight goal!";
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#F43F5E', '#60A5FA', '#A78BFA'];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
}

interface CelebrationOverlayProps {
  visible: boolean;
  milestoneKey: string;
  onDismiss: () => void;
  goalType?: GoalType;
}

function createParticle(): Particle {
  return {
    x: new Animated.Value(Math.random() * SCREEN_WIDTH),
    y: new Animated.Value(-20),
    opacity: new Animated.Value(1),
    rotation: new Animated.Value(0),
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    size: 6 + Math.random() * 8,
  };
}

export function CelebrationOverlay({
  visible,
  milestoneKey,
  onDismiss,
  goalType,
}: CelebrationOverlayProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const particles = useRef<Particle[]>(Array.from({ length: 8 }, createParticle)).current;
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = WEIGHT_MILESTONE_LABELS[milestoneKey] ?? 'Milestone Reached!';
  const emoji = WEIGHT_MILESTONE_EMOJIS[milestoneKey] ?? '🏆';

  useEffect(() => {
    if (visible) {
      // Reset particles
      particles.forEach((p) => {
        p.x.setValue(Math.random() * SCREEN_WIDTH);
        p.y.setValue(-20);
        p.opacity.setValue(1);
        p.rotation.setValue(0);
      });

      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      // Animate particles
      particles.forEach((p, i) => {
        Animated.parallel([
          Animated.timing(p.y, {
            toValue: SCREEN_HEIGHT + 40,
            duration: 2000 + Math.random() * 1500,
            delay: i * 120,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: p.x._value + (Math.random() - 0.5) * 150,
            duration: 2000 + Math.random() * 1500,
            delay: i * 120,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 1800,
            delay: i * 120 + 500,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotation, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 2000 + Math.random() * 1000,
            delay: i * 120,
            useNativeDriver: true,
          }),
        ]).start();
      });

      autoTimer.current = setTimeout(onDismiss, 5000);
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      if (autoTimer.current) clearTimeout(autoTimer.current);
    }

    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {/* Confetti particles */}
        {particles.map((p, i) => {
          const rotate = p.rotation.interpolate({
            inputRange: [-360, 360],
            outputRange: ['-360deg', '360deg'],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.size * 0.2,
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { rotate },
                  ],
                },
              ]}
            />
          );
        })}

        {/* Center card */}
        <Animated.View
          style={[styles.cardWrapper, { transform: [{ scale: cardScale }], opacity: cardOpacity }]}
        >
          <View style={styles.card}>
            <Text style={styles.celebEmoji}>{emoji}</Text>
            <Text style={styles.celebTitle}>{title}</Text>
            <Text style={styles.celebSubtitle}>{getSubtitle(goalType)}</Text>

            <Pressable onPress={onDismiss} style={styles.dismissButton}>
              <LinearGradient
                colors={['#2563EB', '#60A5FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dismissGradient}
              >
                <Text style={styles.dismissText}>Awesome!</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardWrapper: {
    width: SCREEN_WIDTH - 48,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  celebEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  celebTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  celebSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  dismissButton: {
    marginTop: 8,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dismissGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
