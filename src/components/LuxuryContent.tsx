// SPENDTRAK LUXURY CONTENT REVEAL
// Staggered fade-in for content elements
// Creates elegant, cinematic content reveals

import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LUXURY_DURATION, LUXURY_EASING } from '../config/luxuryAnimations';

interface LuxuryContentProps {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
}

// Individual content element with staggered fade
export const LuxuryContent: React.FC<LuxuryContentProps> = ({
  children,
  index = 0,
  style,
}) => {
  return (
    <Animated.View
      style={style}
      entering={FadeIn
        .delay(index * LUXURY_DURATION.staggerDelay)
        .duration(LUXURY_DURATION.contentReveal)
        .easing(LUXURY_EASING.smooth)
      }
    >
      {children}
    </Animated.View>
  );
};

// Wrapper for list items
interface LuxuryListItemProps {
  children: React.ReactNode;
  index: number;
  style?: ViewStyle;
}

export const LuxuryListItem: React.FC<LuxuryListItemProps> = ({
  children,
  index,
  style,
}) => {
  return (
    <Animated.View
      style={style}
      entering={FadeIn
        .delay(index * LUXURY_DURATION.staggerDelay)
        .duration(LUXURY_DURATION.listItemEnter)
        .easing(LUXURY_EASING.enter)
      }
    >
      {children}
    </Animated.View>
  );
};

export default LuxuryContent;
