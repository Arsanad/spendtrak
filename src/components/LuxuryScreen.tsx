// SPENDTRAK LUXURY SCREEN WRAPPER
// Cinematic fade + subtle scale entrance animation
// Creates the "emerging from darkness" effect

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { LUXURY_DURATION, LUXURY_EASING, LUXURY_SCALE } from '../config/luxuryAnimations';

interface LuxuryScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const LuxuryScreen: React.FC<LuxuryScreenProps> = ({
  children,
  style,
}) => {
  const progress = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      // Screen enters - slow fade in with subtle scale
      progress.value = withTiming(1, {
        duration: LUXURY_DURATION.screenEnter,
        easing: LUXURY_EASING.enter,
      });

      return () => {
        // Screen exits - fade out
        progress.value = withTiming(0, {
          duration: LUXURY_DURATION.screenExit,
          easing: LUXURY_EASING.exit,
        });
      };
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [LUXURY_SCALE.screenEnter.from, LUXURY_SCALE.screenEnter.to]
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default LuxuryScreen;
