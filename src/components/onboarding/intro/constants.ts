/**
 * SpendTrak Premium Cinematic Intro - Animation Constants
 * $100M Fintech Quality
 *
 * Total Duration: 6000ms (6 seconds)
 * Phases OVERLAP for smooth premium transitions
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// TIMING CONSTANTS - WITH OVERLAPPING PHASES
// ==========================================

export const TIMING = {
  // Phase 1: Dark Void + Noise + Scanlines (0-600ms)
  phase1Start: 0,
  phase1Duration: 600,

  // Phase 2: Particle Birth - OVERLAPS with phase 1 (400-1600ms)
  phase2Start: 400,
  phase2Duration: 1200,

  // Phase 3: Logo Glitch Assembly (1400-2600ms)
  phase3Start: 1400,
  phase3Duration: 1200,

  // Phase 4: Ring Expansion (2400-3600ms)
  phase4Start: 2400,
  phase4Duration: 1200,

  // Phase 5: Title Typewriter (3400-4600ms)
  phase5Start: 3400,
  phase5Duration: 1200,

  // Phase 6: Final Polish - Particles converge + flash (4600-6000ms)
  phase6Start: 4600,
  phase6Duration: 1400,

  // Total
  totalDuration: 6000,

  // Scan line timing
  scanLineStart: 50,
  scanLineDuration: 500,
  scanLineCount: 3,

  // Noise
  noiseIn: 150,

  // Particle timing
  particleStagger: 8,
  particleSpiralDuration: 900,
  particleConvergeDuration: 800,

  // Logo timing
  sliceStagger: 40,
  glitchBurstCount: 4,
  glitchBurstInterval: 250,

  // Ring timing
  ringStagger: 120,
  ringExpandDuration: 700,

  // Text timing
  letterInterval: 60,
  letterGlowDuration: 150,
  cursorBlinkInterval: 400,

  // Flare timing
  flareStart: 1600,
  flareDuration: 1200,

  // Final flash and fade
  flashStart: 200,
  flashDuration: 300,
  fadeOutStart: 800,
  fadeOutDuration: 600,
} as const;

// ==========================================
// COLOR PALETTE
// ==========================================

export const COLORS = {
  // Primary greens
  primary: '#00FF88',
  secondary: '#00CC6A',
  accent: '#88FFB8',
  light: '#00FFAA',
  dim: '#00AA55',
  dark: '#008040',

  // Glow
  glow: 'rgba(0, 255, 136, 0.6)',
  glowStrong: 'rgba(0, 255, 136, 0.8)',
  glowSubtle: 'rgba(0, 255, 136, 0.3)',

  // RGB split
  rgbRed: '#FF3366',
  rgbBlue: '#3366FF',
  rgbCyan: '#00FFFF',

  // Background
  void: '#000000',
  voidLight: '#001a0f',

  // Noise
  noise: 'rgba(0, 255, 136, 0.02)',

  // Gradient
  gradient: ['#000000', '#001a0f', '#000000'],
} as const;

// ==========================================
// PARTICLE SYSTEM CONFIG
// ==========================================

export const PARTICLE_CONFIG = {
  // Particle counts
  totalCount: 60,
  trailParticles: 40, // particles with trails
  sparkleCount: 8, // bright flash particles

  // Sizes
  sizes: [2, 3, 4, 5, 6, 8],

  // Colors for particles
  colors: [
    COLORS.primary,
    COLORS.secondary,
    COLORS.accent,
    COLORS.light,
  ],

  // Trail config
  trailLength: 5,
  trailOpacityDecay: 0.2,

  // Spiral config
  goldenAngle: 137.508,
  maxRadius: Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.45,
  spiralTurns: 3,

  // Animation
  minSpeed: 0.7,
  maxSpeed: 1.3,
  pulseChance: 0.3, // 30% of particles pulse
} as const;

// ==========================================
// LOGO GLITCH CONFIG
// ==========================================

export const GLITCH_CONFIG = {
  // Slice config
  sliceCount: 10,
  maxSliceOffset: 25, // pixels

  // RGB split
  rgbOffsetMin: 4,
  rgbOffsetMax: 10,

  // Corruption squares
  corruptionCount: 12,
  corruptionMinSize: 4,
  corruptionMaxSize: 16,

  // Hologram scan lines
  scanLineCount: 8,
  scanLineOpacity: 0.15,

  // Glitch bursts
  burstCount: 4,
  burstIntensity: [0.6, 0.9, 0.7, 1.0], // intensity of each burst

  // Scale animation
  startScale: 0.5,
  endScale: 1.0,

  // Logo size
  logoSize: 140,
} as const;

// ==========================================
// RING CONFIG
// ==========================================

export const RING_CONFIG = {
  baseSize: 160,
  ringCount: 5,

  rings: [
    {
      id: 1,
      strokeWidth: 1,
      style: 'solid',
      color: COLORS.primary,
      endScale: 3.0,
      speed: 1.2,
      rotation: 0,
      glow: true,
    },
    {
      id: 2,
      strokeWidth: 1.5,
      style: 'dashed',
      dashArray: [12, 6],
      color: COLORS.secondary,
      endScale: 2.6,
      speed: 1.0,
      rotation: 180, // clockwise
      glow: true,
    },
    {
      id: 3,
      strokeWidth: 1,
      style: 'dotted',
      dashArray: [3, 8],
      color: COLORS.accent,
      endScale: 2.2,
      speed: 0.8,
      rotation: -120, // counter-clockwise
      glow: false,
    },
    {
      id: 4,
      strokeWidth: 2,
      style: 'double',
      color: COLORS.light,
      endScale: 1.8,
      speed: 0.9,
      rotation: 0,
      pulses: true,
      glow: true,
    },
    {
      id: 5,
      strokeWidth: 0,
      style: 'particles',
      particleCount: 24,
      color: COLORS.primary,
      endScale: 1.5,
      speed: 0.7,
      rotation: 90,
      glow: false,
    },
  ],

  // Data nodes
  dataNodes: [
    { angle: 30, icon: '$', color: COLORS.primary },
    { angle: 90, icon: '%', color: COLORS.secondary },
    { angle: 150, icon: '€', color: COLORS.accent },
    { angle: 210, icon: '£', color: COLORS.light },
    { angle: 270, icon: '¥', color: COLORS.primary },
    { angle: 330, icon: '₿', color: COLORS.secondary },
  ],
} as const;

// ==========================================
// TEXT CONFIG
// ==========================================

export const TEXT_CONFIG = {
  title: 'SPENDTRAK',
  tagline: 'Smart Finance, Simplified',

  // Letter effects
  letterGlowRadius: 30,
  letterGlowIntensity: 1.5,

  // Camera shake
  shakeIntensity: 3,
  shakeDuration: 50,

  // Typewriter
  cursorWidth: 2,
  cursorHeight: 36,

  // Tagline blur
  blurStart: 8,
  blurEnd: 0,

  // Final glitch
  finalGlitchDuration: 200,

  // Random offset for vintage feel
  maxVerticalOffset: 2,
} as const;

// ==========================================
// SCAN LINE CONFIG
// ==========================================

export const SCANLINE_CONFIG = {
  // Horizontal scan lines
  horizontalCount: 3,
  horizontalSpeeds: [1.0, 0.7, 1.3],
  horizontalOpacities: [0.8, 0.5, 0.6],

  // Grid effect
  gridEnabled: true,
  gridLineCount: 12,
  gridOpacity: 0.04,

  // Glow
  glowRadius: 10,
  glowColor: COLORS.glow,
} as const;

// ==========================================
// BACKGROUND GRID CONFIG
// ==========================================

export const GRID_CONFIG = {
  enabled: true,
  lineCount: 20,
  perspective: 0.6,
  animationSpeed: 0.3,
  opacity: 0.06,
  color: COLORS.primary,
  pulseEnabled: true,
} as const;

// ==========================================
// FLARE CONFIG
// ==========================================

export const FLARE_CONFIG = {
  enabled: true,
  size: 200,
  opacity: 0.4,
  color: COLORS.glowStrong,
  startX: -100,
  endX: SCREEN_WIDTH + 100,
  y: SCREEN_HEIGHT * 0.4,
} as const;

// ==========================================
// SCREEN DIMENSIONS
// ==========================================

export const DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  centerX: SCREEN_WIDTH / 2,
  centerY: SCREEN_HEIGHT / 2,
} as const;

// Alias for backwards compatibility
export const INTRO_COLORS = COLORS;

export default {
  TIMING,
  COLORS,
  INTRO_COLORS,
  PARTICLE_CONFIG,
  GLITCH_CONFIG,
  RING_CONFIG,
  TEXT_CONFIG,
  SCANLINE_CONFIG,
  GRID_CONFIG,
  FLARE_CONFIG,
  DIMENSIONS,
};
