/**
 * DynamicSpeechBubble Component
 * A speech bubble that follows QUANTUM anywhere on screen
 * Adjusts position and tail direction based on QUANTUM's location
 */

import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@/design/cinematic';
import { zIndex as themeZIndex } from '@/theme';
import { TypewriterText } from './TypewriterText';
import { playQuantumFeedback } from '@/utils/quantumSounds';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type BubbleType = 'acknowledgment' | 'intervention' | 'celebration' | 'tip' | 'alert';

// Position where bubble should appear relative to QUANTUM
export type BubblePosition = 'below' | 'above' | 'left' | 'right';

export interface DynamicSpeechBubbleProps {
  message: string;
  type: BubbleType;
  visible: boolean;
  quantumX: number;
  quantumY: number;
  quantumSize: number;
  onComplete?: () => void;
}

// Style configurations by type
const TYPE_CONFIGS: Record<BubbleType, {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  maxWidth: number;
}> = {
  acknowledgment: {
    backgroundColor: 'rgba(10, 15, 20, 0.95)',
    borderColor: Colors.neon,
    textColor: Colors.neon,
    maxWidth: 180,
  },
  intervention: {
    backgroundColor: 'rgba(20, 15, 10, 0.95)',
    borderColor: Colors.semantic.warning,
    textColor: Colors.text.primary,
    maxWidth: 240,
  },
  celebration: {
    backgroundColor: 'rgba(10, 20, 15, 0.95)',
    borderColor: Colors.semantic.success,
    textColor: Colors.semantic.success,
    maxWidth: 260,
  },
  tip: {
    backgroundColor: 'rgba(10, 15, 25, 0.95)',
    borderColor: Colors.semantic.info,
    textColor: Colors.text.primary,
    maxWidth: 220,
  },
  alert: {
    backgroundColor: 'rgba(25, 15, 10, 0.95)',
    borderColor: Colors.semantic.error,
    textColor: Colors.text.primary,
    maxWidth: 240,
  },
};

export const DynamicSpeechBubble: React.FC<DynamicSpeechBubbleProps> = ({
  message,
  type,
  visible,
  quantumX,
  quantumY,
  quantumSize,
  onComplete,
}) => {
  const config = TYPE_CONFIGS[type];
  const scale = useSharedValue(0);

  // Determine best position for bubble based on QUANTUM's location
  const bubblePosition = useMemo((): BubblePosition => {
    const padding = 20;

    // If QUANTUM is in top half, bubble goes below
    if (quantumY < SCREEN_HEIGHT / 2) {
      return 'below';
    }
    // If QUANTUM is in bottom half, bubble goes above
    return 'above';
  }, [quantumY]);

  // Calculate bubble position
  const bubbleStyle = useMemo(() => {
    const offset = quantumSize / 2 + 15; // Distance from QUANTUM center

    switch (bubblePosition) {
      case 'below':
        return {
          top: quantumY + offset,
          left: Math.max(20, Math.min(quantumX - config.maxWidth / 2, SCREEN_WIDTH - config.maxWidth - 20)),
        };
      case 'above':
        return {
          top: quantumY - offset - 80, // Approximate bubble height
          left: Math.max(20, Math.min(quantumX - config.maxWidth / 2, SCREEN_WIDTH - config.maxWidth - 20)),
        };
      case 'left':
        return {
          top: quantumY - 40,
          right: SCREEN_WIDTH - quantumX + offset,
        };
      case 'right':
        return {
          top: quantumY - 40,
          left: quantumX + offset,
        };
      default:
        return { top: quantumY + offset, left: quantumX - config.maxWidth / 2 };
    }
  }, [quantumX, quantumY, quantumSize, bubblePosition, config.maxWidth]);

  // Tail position (points toward QUANTUM)
  const tailStyle = useMemo(() => {
    switch (bubblePosition) {
      case 'below':
        return {
          position: 'absolute' as const,
          top: -10,
          left: Math.min(Math.max(quantumX - bubbleStyle.left! - 10, 20), config.maxWidth - 40),
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: config.borderColor,
        };
      case 'above':
        return {
          position: 'absolute' as const,
          bottom: -10,
          left: Math.min(Math.max(quantumX - bubbleStyle.left! - 10, 20), config.maxWidth - 40),
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: config.borderColor,
        };
      default:
        return {};
    }
  }, [bubblePosition, quantumX, bubbleStyle, config]);

  // Animate in (no sound on entrance - only on completion)
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Handle completion - play sound only when message finishes
  const handleComplete = () => {
    // Play completion sound only for celebrations (major wins)
    if (type === 'celebration') {
      playQuantumFeedback('success');
    }
    // Call original onComplete callback
    onComplete?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !message) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[
        styles.container,
        bubbleStyle,
        animatedStyle,
      ]}
    >
      {/* Main bubble */}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
            maxWidth: config.maxWidth,
          },
        ]}
      >
        {/* Tail pointing to QUANTUM */}
        <View style={tailStyle} />

        {/* Inner tail (for filled effect) */}
        <View
          style={[
            tailStyle,
            bubblePosition === 'below' ? { top: -8, borderBottomColor: config.backgroundColor } :
            bubblePosition === 'above' ? { bottom: -8, borderTopColor: config.backgroundColor } : {},
          ]}
        />

        {/* Message with typewriter effect */}
        <TypewriterText
          text={message}
          speed={type === 'celebration' ? 30 : 40}
          style={[styles.text, { color: config.textColor }]}
          onComplete={handleComplete}
          showCursor={true}
        />
      </View>

      {/* Glow effect */}
      <View
        style={[
          styles.glow,
          {
            backgroundColor: config.borderColor,
            shadowColor: config.borderColor,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: themeZIndex.quantum, // Standardized z-index from theme (500)
  },
  bubble: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
    opacity: 0.1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    zIndex: -1,
  },
});

export default DynamicSpeechBubble;
