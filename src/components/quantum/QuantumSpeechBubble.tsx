/**
 * QUANTUM Speech Bubble
 * A speech bubble that appears connected to the QUANTUM avatar
 * Features typewriter text effect and bounce-in animation
 * Makes QUANTUM feel like a living AI companion (like Duolingo's owl!)
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@/design/cinematic';
import { playQuantumFeedback } from '@/utils/quantumSounds';

export type SpeechBubbleType = 'acknowledgment' | 'intervention';

export interface QuantumSpeechBubbleProps {
  message: string;
  type: SpeechBubbleType;
  visible: boolean;
  onComplete: () => void;
  /** Duration before auto-dismiss (ms). Default: 2500 for acknowledgment, manual for intervention */
  duration?: number;
}

// Timing constants
const TYPEWRITER_SPEED = 30; // ms per character
const BUBBLE_APPEAR_DURATION = 300;
const BUBBLE_FADE_OUT_DURATION = 400;
const DEFAULT_ACKNOWLEDGMENT_DURATION = 2500;

// Style configurations by type
const TYPE_STYLES: Record<SpeechBubbleType, {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  tailColor: string;
}> = {
  acknowledgment: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.neon,
    textColor: Colors.neon,
    tailColor: Colors.background.secondary,
  },
  intervention: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.semantic.warning,
    textColor: Colors.text.primary,
    tailColor: Colors.background.tertiary,
  },
};

export const QuantumSpeechBubble: React.FC<QuantumSpeechBubbleProps> = ({
  message,
  type,
  visible,
  onComplete,
  duration,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const dismissRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  const styles = TYPE_STYLES[type];
  const autoDismissDuration = duration || (type === 'acknowledgment' ? DEFAULT_ACKNOWLEDGMENT_DURATION : undefined);

  // Typewriter effect
  useEffect(() => {
    if (visible && message) {
      // Reset
      setDisplayedText('');
      setIsTyping(true);

      // Play speak haptic
      playQuantumFeedback('speak');

      // Animate bubble in
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      opacity.value = withTiming(1, { duration: BUBBLE_APPEAR_DURATION });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });

      // Typewriter effect
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < message.length) {
          setDisplayedText(message.substring(0, currentIndex + 1));
          currentIndex++;
          typewriterRef.current = setTimeout(typeNextChar, TYPEWRITER_SPEED);
        } else {
          setIsTyping(false);

          // Play completion haptic
          if (type === 'acknowledgment') {
            playQuantumFeedback('acknowledge');
          } else {
            playQuantumFeedback('intervention');
          }

          // Auto-dismiss for acknowledgments
          if (autoDismissDuration) {
            const remainingTime = autoDismissDuration - (message.length * TYPEWRITER_SPEED) - BUBBLE_APPEAR_DURATION;
            dismissRef.current = setTimeout(() => {
              dismissBubble();
            }, Math.max(remainingTime, 500));
          }
        }
      };

      // Start typing after bubble appears
      typewriterRef.current = setTimeout(typeNextChar, BUBBLE_APPEAR_DURATION);

      return () => {
        if (typewriterRef.current) clearTimeout(typewriterRef.current);
        if (dismissRef.current) clearTimeout(dismissRef.current);
      };
    }
  }, [visible, message]);

  const dismissBubble = () => {
    // Animate out
    scale.value = withTiming(0.8, { duration: BUBBLE_FADE_OUT_DURATION });
    opacity.value = withTiming(0, { duration: BUBBLE_FADE_OUT_DURATION });
    translateY.value = withTiming(-10, { duration: BUBBLE_FADE_OUT_DURATION });

    // Notify parent after animation
    setTimeout(() => {
      onComplete();
    }, BUBBLE_FADE_OUT_DURATION);
  };

  // Animated styles
  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  // Blinking cursor for typewriter
  const cursorOpacity = useSharedValue(1);
  useEffect(() => {
    if (isTyping) {
      cursorOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );
      // Repeat
      const interval = setInterval(() => {
        cursorOpacity.value = withSequence(
          withTiming(0, { duration: 300 }),
          withTiming(1, { duration: 300 }),
        );
      }, 600);
      return () => clearInterval(interval);
    } else {
      cursorOpacity.value = 0;
    }
  }, [isTyping]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[componentStyles.container, bubbleAnimatedStyle]}>
      {/* Speech bubble tail (pointing up to QUANTUM) */}
      <View style={[componentStyles.tail, { borderBottomColor: styles.borderColor }]}>
        <View style={[componentStyles.tailInner, { borderBottomColor: styles.tailColor }]} />
      </View>

      {/* Bubble content */}
      <View
        style={[
          componentStyles.bubble,
          {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
          },
        ]}
      >
        <Text style={[componentStyles.text, { color: styles.textColor }]}>
          {displayedText}
          <Animated.Text style={[componentStyles.cursor, cursorStyle, { color: styles.textColor }]}>
            |
          </Animated.Text>
        </Text>
      </View>
    </Animated.View>
  );
};

const componentStyles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginRight: Spacing.md,
    marginTop: -Spacing.xs,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginRight: Spacing.lg,
  },
  tailInner: {
    position: 'absolute',
    top: 2,
    left: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    maxWidth: 200,
    minWidth: 80,
    // Glow effect
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  cursor: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
  },
});

export default QuantumSpeechBubble;
