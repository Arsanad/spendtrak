/**
 * SpendTrak Behavioral Engine v2.0
 * WinCelebration - Minimal celebration for behavioral wins
 *
 * Design constraints:
 * - Short message only (max 12 words)
 * - No motivation, just observation
 * - Auto-dismiss after 5 seconds
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { easeInOutQuad } from '../../config/easingFunctions';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, TextStyles, Shadows, FontFamily, FontSize } from '@/design/cinematic';
import type { BehavioralWin } from '@/types/behavior';
import type { WinType } from '@/config/behavioralConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface WinCelebrationProps {
  win: BehavioralWin;
  onDismiss: () => void;
}

const WIN_TYPE_CONFIG: Record<WinType, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: string[];
}> = {
  pattern_break: {
    icon: 'flash',
    color: Colors.neon,
    gradient: [Colors.transparent.neon20, Colors.transparent.neon05],
  },
  improvement: {
    icon: 'trending-up',
    color: Colors.semantic.info,
    gradient: ['rgba(96, 165, 250, 0.2)', 'rgba(96, 165, 250, 0.05)'],
  },
  streak_milestone: {
    icon: 'flame',
    color: Colors.semantic.warning,
    gradient: ['rgba(230, 167, 86, 0.2)', 'rgba(230, 167, 86, 0.05)'],
  },
  silent_win: {
    icon: 'checkmark-circle',
    color: Colors.semantic.success,
    gradient: ['rgba(57, 255, 20, 0.2)', 'rgba(57, 255, 20, 0.05)'],
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const WinCelebration: React.FC<WinCelebrationProps> = ({
  win,
  onDismiss,
}) => {
  const config = WIN_TYPE_CONFIG[win.win_type] || WIN_TYPE_CONFIG.pattern_break;
  const scale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Entry animations
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });

    iconRotate.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: easeInOutQuad }),
        withTiming(0.5, { duration: 1000, easing: easeInOutQuad })
      ),
      -1,
      true
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      {/* Blur background */}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={config.gradient as [string, string]}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Card */}
      <AnimatedPressable onPress={onDismiss} style={[styles.card, cardStyle]}>
        <LinearGradient
          colors={[Colors.background.tertiary, Colors.background.secondary, Colors.void]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Icon */}
        <Animated.View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }, iconStyle]}>
          <Ionicons name={config.icon} size={48} color={config.color} />
        </Animated.View>

        {/* Message - short, observational */}
        <Text style={[styles.message, { color: config.color }]}>
          {win.message}
        </Text>

        {/* Streak indicator */}
        {win.win_type === 'streak_milestone' && win.streak_days && (
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color={Colors.semantic.warning} />
            <Text style={styles.streakText}>{win.streak_days} days</Text>
          </View>
        )}

        {/* Dismiss hint */}
        <Text style={styles.dismissHint}>Tap to continue</Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  glowContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: 400,
    borderRadius: 200,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 200,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 360,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.glowStrong,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLarge,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  streakText: {
    ...TextStyles.caption,
    color: Colors.semantic.warning,
    fontWeight: '600',
  },
  dismissHint: {
    ...TextStyles.caption,
    color: Colors.text.disabled,
    marginTop: Spacing.sm,
  },
});

export default WinCelebration;
