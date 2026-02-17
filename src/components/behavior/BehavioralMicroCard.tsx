/**
 * SpendTrak Behavioral Engine v2.0
 * BehavioralMicroCard - Compact intervention card
 *
 * Design constraints:
 * - Max 12 words in message
 * - No advice, no motivation
 * - Minimal, mirror-like aesthetic
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SlideInRight,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, TextStyles } from '@/design/cinematic';
import type { BehaviorType } from '@/config/behavioralConstants';

export interface BehavioralMicroCardProps {
  message: string;
  behaviorType: BehaviorType;
  onDismiss: () => void;
  onEngage: () => void;
}

const BEHAVIOR_ICONS: Record<BehaviorType, keyof typeof Ionicons.glyphMap> = {
  small_recurring: 'repeat-outline',
  stress_spending: 'moon-outline',
  end_of_month: 'calendar-outline',
};

const BEHAVIOR_COLORS: Record<BehaviorType, string> = {
  small_recurring: Colors.semantic.warning,
  stress_spending: Colors.semantic.info,
  end_of_month: Colors.semantic.error,
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const BehavioralMicroCard: React.FC<BehavioralMicroCardProps> = memo(({
  message,
  behaviorType,
  onDismiss,
  onEngage,
}) => {
  const scale = useSharedValue(1);
  const accentColor = BEHAVIOR_COLORS[behaviorType];
  const icon = BEHAVIOR_ICONS[behaviorType];

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView
      entering={SlideInRight.duration(300).springify()}
      exiting={FadeOut.duration(200)}
      style={[styles.container, animatedStyle]}
    >
      <LinearGradient
        colors={[Colors.background.tertiary, Colors.background.secondary, Colors.void]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent line */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>

        {/* Message - max 12 words, observation only */}
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Dismiss */}
          <Pressable
            onPress={onDismiss}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={Colors.text.tertiary} />
          </Pressable>

          {/* Engage */}
          <Pressable
            onPress={onEngage}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.engageButton, { backgroundColor: `${accentColor}30` }]}
            hitSlop={8}
          >
            <Ionicons name="chatbubble-outline" size={16} color={accentColor} />
          </Pressable>
        </View>
      </View>
    </AnimatedView>
  );
});

BehavioralMicroCard.displayName = 'BehavioralMicroCard';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingLeft: Spacing.lg,
    minHeight: 56,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    ...TextStyles.body,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engageButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BehavioralMicroCard;
