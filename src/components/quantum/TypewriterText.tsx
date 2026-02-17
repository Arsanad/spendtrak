/**
 * TypewriterText Component
 * Text that types out letter by letter, like QUANTUM is actually typing
 * Creates that satisfying Duolingo-style text reveal
 */

import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize } from '@/design/cinematic';

export interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  style?: StyleProp<TextStyle>;
  onComplete?: () => void;
  showCursor?: boolean;
  cursorChar?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 40,
  style,
  onComplete,
  showCursor = true,
  cursorChar = '|',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  // Blinking cursor animation
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsTyping(true);
    indexRef.current = 0;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Type out characters one by one
    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    // Start typing after a small delay
    timeoutRef.current = setTimeout(typeNextChar, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, onComplete]);

  // Cursor blinking animation
  useEffect(() => {
    if (isTyping && showCursor) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        true
      );
    } else if (!isTyping) {
      // Fade out cursor when done
      cursorOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isTyping, showCursor]);

  const cursorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <Text style={[styles.text, style]}>
      {displayedText}
      {showCursor && (
        <Animated.Text style={[styles.cursor, style, cursorAnimatedStyle]}>
          {cursorChar}
        </Animated.Text>
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  cursor: {
    fontFamily: FontFamily.regular,
  },
});

export default TypewriterText;
