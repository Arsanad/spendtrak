/**
 * InlineAIMessage Component
 * Subtle AI observation that appears contextually in the UI
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, TextStyles } from '@/design/cinematic';

export type MessageVariant = 'observation' | 'question' | 'suggestion';

export interface InlineAIMessageProps {
  message: string;
  variant?: MessageVariant;
  onTap?: () => void;
}

const VARIANT_CONFIG: Record<MessageVariant, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = {
  observation: {
    icon: 'eye-outline',
    color: Colors.text.tertiary,
  },
  question: {
    icon: 'help-circle-outline',
    color: Colors.semantic.info,
  },
  suggestion: {
    icon: 'bulb-outline',
    color: Colors.semantic.warning,
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const InlineAIMessage: React.FC<InlineAIMessageProps> = ({
  message,
  variant = 'observation',
  onTap,
}) => {
  const opacity = useSharedValue(1);
  const config = VARIANT_CONFIG[variant];

  const handlePressIn = () => {
    opacity.value = withTiming(0.7, { duration: 100 });
  };

  const handlePressOut = () => {
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const content = (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, animatedStyle]}
    >
      <Ionicons
        name={config.icon}
        size={14}
        color={config.color}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: config.color }]} numberOfLines={2}>
        {message}
      </Text>
      {onTap && (
        <Ionicons
          name="chevron-forward"
          size={12}
          color={Colors.text.disabled}
          style={styles.chevron}
        />
      )}
    </Animated.View>
  );

  if (onTap) {
    return (
      <AnimatedPressable
        onPress={onTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    // Full width touchable area
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xs,
    opacity: 0.8,
  },
  message: {
    flex: 1,
    ...TextStyles.caption,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  chevron: {
    marginLeft: Spacing.xs,
    opacity: 0.5,
  },
});

export default InlineAIMessage;
