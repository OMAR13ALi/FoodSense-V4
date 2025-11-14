/**
 * Animation Configuration Objects
 * Defines animation parameters for each intensity level
 */

export type AnimationIntensity = 'full' | 'balanced' | 'minimal' | 'off';

export interface AnimationConfig {
  phase1: {
    duration: number;
    shimmer: boolean;
    breathing: boolean;
    glow: boolean;
    haptic: 'light' | 'medium' | 'heavy' | null;
  };
  phase2: {
    duration: number;
    explosion: boolean;
    orbital: boolean;
    pulsingGlow: boolean;
    connectingLines: boolean;
    haptic: 'light' | 'medium' | 'heavy' | null;
  };
  phase3: {
    duration: number;
    dramaticEntrance: boolean;
    colorMorph: boolean;
    particles: number;
    halo: boolean;
    counter: boolean;
    haptic: 'heavy' | 'notification' | null;
  };
}

/**
 * FULL - Maximum Wow Factor
 * For high-end devices, users who want maximum delight
 */
export const FULL_ANIMATION_CONFIG: AnimationConfig = {
  phase1: {
    duration: 400,
    shimmer: true,
    breathing: true,
    glow: true,
    haptic: 'light',
  },
  phase2: {
    duration: 400,
    explosion: true,
    orbital: true,
    pulsingGlow: true,
    connectingLines: false, // Optional - can enable later
    haptic: 'medium',
  },
  phase3: {
    duration: 600,
    dramaticEntrance: true,
    colorMorph: true,
    particles: 6,
    halo: true,
    counter: true,
    haptic: 'heavy',
  },
};

/**
 * BALANCED - Smooth Performance
 * For mid-range devices, balanced experience
 */
export const BALANCED_ANIMATION_CONFIG: AnimationConfig = {
  phase1: {
    duration: 300,
    shimmer: true,
    breathing: false,
    glow: false,
    haptic: 'light',
  },
  phase2: {
    duration: 300,
    explosion: true,
    orbital: false,
    pulsingGlow: false,
    connectingLines: false,
    haptic: null, // Skip middle haptic to save battery
  },
  phase3: {
    duration: 400,
    dramaticEntrance: false, // Simpler bounce
    colorMorph: true,
    particles: 3,
    halo: false,
    counter: true,
    haptic: 'notification',
  },
};

/**
 * MINIMAL - Maximum Performance
 * For low-end devices, battery saving, users who prefer speed
 */
export const MINIMAL_ANIMATION_CONFIG: AnimationConfig = {
  phase1: {
    duration: 200,
    shimmer: false,
    breathing: false,
    glow: false,
    haptic: null,
  },
  phase2: {
    duration: 200,
    explosion: false,
    orbital: false,
    pulsingGlow: false,
    connectingLines: false,
    haptic: null,
  },
  phase3: {
    duration: 250,
    dramaticEntrance: false,
    colorMorph: false,
    particles: 0,
    halo: false,
    counter: false,
    haptic: 'notification',
  },
};

/**
 * OFF - Instant Display
 * For accessibility, extreme performance needs, power users
 */
export const OFF_ANIMATION_CONFIG: AnimationConfig = {
  phase1: {
    duration: 0,
    shimmer: false,
    breathing: false,
    glow: false,
    haptic: null,
  },
  phase2: {
    duration: 0,
    explosion: false,
    orbital: false,
    pulsingGlow: false,
    connectingLines: false,
    haptic: null,
  },
  phase3: {
    duration: 0,
    dramaticEntrance: false,
    colorMorph: false,
    particles: 0,
    halo: false,
    counter: false,
    haptic: null,
  },
};

/**
 * Get animation config for given intensity level
 */
export function getAnimationConfig(intensity: AnimationIntensity): AnimationConfig {
  switch (intensity) {
    case 'full':
      return FULL_ANIMATION_CONFIG;
    case 'balanced':
      return BALANCED_ANIMATION_CONFIG;
    case 'minimal':
      return MINIMAL_ANIMATION_CONFIG;
    case 'off':
      return OFF_ANIMATION_CONFIG;
    default:
      return FULL_ANIMATION_CONFIG;
  }
}

/**
 * Helper to get readable label for intensity level
 */
export function getIntensityLabel(intensity: AnimationIntensity): string {
  switch (intensity) {
    case 'full':
      return 'Full';
    case 'balanced':
      return 'Balanced';
    case 'minimal':
      return 'Minimal';
    case 'off':
      return 'Off';
    default:
      return 'Full';
  }
}

/**
 * Helper to get description for intensity level
 */
export function getIntensityDescription(intensity: AnimationIntensity): string {
  switch (intensity) {
    case 'full':
      return 'Maximum wow factor';
    case 'balanced':
      return 'Smooth performance';
    case 'minimal':
      return 'Essential only, fast';
    case 'off':
      return 'Instant, no animations';
    default:
      return 'Maximum wow factor';
  }
}

/**
 * Helper to get emoji for intensity level
 */
export function getIntensityEmoji(intensity: AnimationIntensity): string {
  switch (intensity) {
    case 'full':
      return '✨';
    case 'balanced':
      return '⚡';
    case 'minimal':
      return '⚙️';
    case 'off':
      return '⏭️';
    default:
      return '✨';
  }
}
