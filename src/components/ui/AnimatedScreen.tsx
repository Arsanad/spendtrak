/**
 * AnimatedScreen - Animated screen wrapper for smooth transitions
 * Features: Fade, slide, scale animations on focus
 */
import React, { memo, useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { TIMING, EASING, SPRING } from '@/config/animations';
import { Colors } from '@/design/cinematic';

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animationType?: 'fade' | 'slideUp' | 'slideRight' | 'scale';
  delay?: number;
}

export const AnimatedScreen = memo(
  ({
    children,
    style,
    animationType = 'fade',
    delay = 0,
  }: AnimatedScreenProps) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(animationType === 'slideUp' ? 30 : 0);
    const translateX = useSharedValue(animationType === 'slideRight' ? 30 : 0);
    const scale = useSharedValue(animationType === 'scale' ? 0.97 : 1);

    useFocusEffect(
      useCallback(() => {
        // Enter animation
        opacity.value = withDelay(
          delay,
          withTiming(1, { duration: TIMING.fadeIn, easing: EASING.enter })
        );
        translateY.value = withDelay(delay, withSpring(0, SPRING.page));
        translateX.value = withDelay(delay, withSpring(0, SPRING.page));
        scale.value = withDelay(delay, withSpring(1, SPRING.page));

        // Exit animation on blur
        return () => {
          opacity.value = withTiming(0, {
            duration: TIMING.fadeOut,
            easing: EASING.exit,
          });
          if (animationType === 'slideUp') {
            translateY.value = withTiming(-20, { duration: TIMING.fadeOut });
          }
          if (animationType === 'slideRight') {
            translateX.value = withTiming(-20, { duration: TIMING.fadeOut });
          }
          if (animationType === 'scale') {
            scale.value = withTiming(0.98, { duration: TIMING.fadeOut });
          }
        };
      }, [animationType, delay])
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    }));

    return (
      <Animated.View style={[styles.container, animatedStyle, style]}>
        {children}
      </Animated.View>
    );
  }
);

AnimatedScreen.displayName = 'AnimatedScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
});
