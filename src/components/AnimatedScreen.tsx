// SPENDTRAK CINEMATIC EDITION - Animated Screen Wrapper
// Premium screen entrance/exit animations

import React, { useEffect, useState } from 'react';
import { StyleSheet, ViewStyle, InteractionManager } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  SlideInRight,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import { Colors } from '../design/cinematic';
import { easeOutCubic } from '../config/easingFunctions';

export type AnimationType = 'fade' | 'slide' | 'fadeUp' | 'scale' | 'none';

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  waitForInteraction?: boolean;
}

export const AnimatedScreen: React.FC<AnimatedScreenProps> = ({
  children,
  style,
  animation = 'fade',
  delay = 0,
  duration = 300,
  waitForInteraction = false,
}) => {
  const [isReady, setIsReady] = useState(!waitForInteraction);

  useEffect(() => {
    if (waitForInteraction) {
      const task = InteractionManager.runAfterInteractions(() => {
        setIsReady(true);
      });
      return () => task.cancel();
    }
  }, [waitForInteraction]);

  const getEnteringAnimation = () => {
    switch (animation) {
      case 'fade':
        return FadeIn.duration(duration).delay(delay).easing(easeOutCubic);
      case 'slide':
        return SlideInRight.duration(duration).delay(delay).easing(easeOutCubic);
      case 'fadeUp':
        return FadeInDown.duration(duration).delay(delay).easing(easeOutCubic);
      case 'scale':
        return FadeIn.duration(duration)
          .delay(delay)
          .withInitialValues({ transform: [{ scale: 0.96 }], opacity: 0 });
      case 'none':
        return undefined;
      default:
        return FadeIn.duration(duration).delay(delay).easing(easeOutCubic);
    }
  };

  const getExitingAnimation = () => {
    switch (animation) {
      case 'fade':
        return FadeOut.duration(200);
      case 'slide':
        return SlideOutRight.duration(250);
      case 'fadeUp':
        return FadeOutUp.duration(200);
      case 'scale':
        return FadeOut.duration(200);
      case 'none':
        return undefined;
      default:
        return FadeOut.duration(200);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, style]}
      entering={getEnteringAnimation()}
      exiting={getExitingAnimation()}
      layout={Layout.duration(300)}
    >
      {children}
    </Animated.View>
  );
};

// Staggered content wrapper for list items
interface StaggeredContentProps {
  children: React.ReactNode;
  index: number;
  baseDelay?: number;
}

export const StaggeredItem: React.FC<StaggeredContentProps> = ({
  children,
  index,
  baseDelay = 50,
}) => {
  return (
    <Animated.View
      entering={FadeInDown
        .delay(index * baseDelay)
        .duration(350)
        .springify()
        .damping(18)
      }
    >
      {children}
    </Animated.View>
  );
};

// Fade wrapper for simple fade animations
interface FadeWrapperProps {
  children: React.ReactNode;
  visible: boolean;
  duration?: number;
}

export const FadeWrapper: React.FC<FadeWrapperProps> = ({
  children,
  visible,
  duration = 200,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration });
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
});

export default AnimatedScreen;
