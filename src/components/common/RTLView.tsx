// SPENDTRAK - RTL Support Components
// Provides RTL-aware layout components and hooks

import React, { memo } from 'react';
import { View, ViewStyle, StyleSheet, I18nManager } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

// ==================== RTL VIEW COMPONENT ====================

interface RTLViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  row?: boolean;
}

/**
 * RTLView - A View component that automatically handles RTL layout
 * When row=true, it reverses flex direction for RTL languages
 */
export const RTLView: React.FC<RTLViewProps> = memo(({
  children,
  style,
  row = false
}) => {
  const { isRTL } = useLanguage();

  const rtlStyle: ViewStyle = row
    ? { flexDirection: isRTL ? 'row-reverse' : 'row' }
    : {};

  return (
    <View style={[rtlStyle, style]}>
      {children}
    </View>
  );
});

RTLView.displayName = 'RTLView';

// ==================== RTL TEXT ALIGN COMPONENT ====================

interface RTLTextContainerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * RTLTextContainer - A container that aligns text correctly for RTL/LTR
 */
export const RTLTextContainer: React.FC<RTLTextContainerProps> = memo(({
  children,
  style
}) => {
  const { isRTL } = useLanguage();

  return (
    <View style={[{ alignItems: isRTL ? 'flex-end' : 'flex-start' }, style]}>
      {children}
    </View>
  );
});

RTLTextContainer.displayName = 'RTLTextContainer';

// ==================== RTL STYLES HOOK ====================

/**
 * useRTLStyles - Hook that returns RTL-aware style utilities
 */
export const useRTLStyles = () => {
  const { isRTL } = useLanguage();

  return {
    // Layout direction
    isRTL,

    // Flex directions
    row: { flexDirection: isRTL ? 'row-reverse' : 'row' } as ViewStyle,
    rowReverse: { flexDirection: isRTL ? 'row' : 'row-reverse' } as ViewStyle,

    // Text alignment
    textAlign: isRTL ? 'right' : 'left' as 'left' | 'right',
    textAlignOpposite: isRTL ? 'left' : 'right' as 'left' | 'right',

    // Alignment
    alignStart: { alignItems: isRTL ? 'flex-end' : 'flex-start' } as ViewStyle,
    alignEnd: { alignItems: isRTL ? 'flex-start' : 'flex-end' } as ViewStyle,
    justifyStart: { justifyContent: isRTL ? 'flex-end' : 'flex-start' } as ViewStyle,
    justifyEnd: { justifyContent: isRTL ? 'flex-start' : 'flex-end' } as ViewStyle,

    // Self alignment
    alignSelfStart: { alignSelf: isRTL ? 'flex-end' : 'flex-start' } as ViewStyle,
    alignSelfEnd: { alignSelf: isRTL ? 'flex-start' : 'flex-end' } as ViewStyle,

    // Margins (swap left/right for RTL)
    marginStart: (value: number) => ({
      marginLeft: isRTL ? 0 : value,
      marginRight: isRTL ? value : 0
    } as ViewStyle),
    marginEnd: (value: number) => ({
      marginLeft: isRTL ? value : 0,
      marginRight: isRTL ? 0 : value
    } as ViewStyle),

    // Paddings (swap left/right for RTL)
    paddingStart: (value: number) => ({
      paddingLeft: isRTL ? 0 : value,
      paddingRight: isRTL ? value : 0
    } as ViewStyle),
    paddingEnd: (value: number) => ({
      paddingLeft: isRTL ? value : 0,
      paddingRight: isRTL ? 0 : value
    } as ViewStyle),

    // Border radius (for directional corners)
    borderRadiusStart: (value: number) => ({
      borderTopLeftRadius: isRTL ? 0 : value,
      borderBottomLeftRadius: isRTL ? 0 : value,
      borderTopRightRadius: isRTL ? value : 0,
      borderBottomRightRadius: isRTL ? value : 0,
    } as ViewStyle),
    borderRadiusEnd: (value: number) => ({
      borderTopLeftRadius: isRTL ? value : 0,
      borderBottomLeftRadius: isRTL ? value : 0,
      borderTopRightRadius: isRTL ? 0 : value,
      borderBottomRightRadius: isRTL ? 0 : value,
    } as ViewStyle),

    // Position (swap left/right for RTL)
    positionStart: (value: number) => ({
      left: isRTL ? undefined : value,
      right: isRTL ? value : undefined
    } as ViewStyle),
    positionEnd: (value: number) => ({
      left: isRTL ? value : undefined,
      right: isRTL ? undefined : value
    } as ViewStyle),

    // Transform for icons/chevrons (rotate for RTL)
    iconTransform: { transform: [{ scaleX: isRTL ? -1 : 1 }] } as ViewStyle,

    // Chevron rotation (for back/forward arrows)
    chevronBack: { transform: [{ rotate: isRTL ? '180deg' : '0deg' }] } as ViewStyle,
    chevronForward: { transform: [{ rotate: isRTL ? '0deg' : '180deg' }] } as ViewStyle,
  };
};

// ==================== RTL AWARE ICON WRAPPER ====================

interface RTLIconProps {
  children: React.ReactNode;
  flip?: boolean;
  style?: ViewStyle;
}

/**
 * RTLIcon - Wrapper that flips icons horizontally for RTL when needed
 * Use flip=true for directional icons (arrows, chevrons)
 */
export const RTLIcon: React.FC<RTLIconProps> = memo(({
  children,
  flip = false,
  style
}) => {
  const { isRTL } = useLanguage();

  const shouldFlip = flip && isRTL;

  return (
    <View style={[shouldFlip && styles.flipped, style]}>
      {children}
    </View>
  );
});

RTLIcon.displayName = 'RTLIcon';

// ==================== RTL SAFE ABSOLUTE POSITION ====================

interface RTLAbsoluteProps {
  children: React.ReactNode;
  start?: number;
  end?: number;
  top?: number;
  bottom?: number;
  style?: ViewStyle;
}

/**
 * RTLAbsolute - Absolute positioned component with RTL-aware start/end
 */
export const RTLAbsolute: React.FC<RTLAbsoluteProps> = memo(({
  children,
  start,
  end,
  top,
  bottom,
  style,
}) => {
  const { isRTL } = useLanguage();

  const positionStyle: ViewStyle = {
    position: 'absolute',
    ...(top !== undefined && { top }),
    ...(bottom !== undefined && { bottom }),
    ...(start !== undefined && (isRTL ? { right: start } : { left: start })),
    ...(end !== undefined && (isRTL ? { left: end } : { right: end })),
  };

  return (
    <View style={[positionStyle, style]}>
      {children}
    </View>
  );
});

RTLAbsolute.displayName = 'RTLAbsolute';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  flipped: {
    transform: [{ scaleX: -1 }],
  },
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get the current RTL status from I18nManager
 * Useful for static style calculations outside of components
 */
export const isRTLLayout = (): boolean => I18nManager.isRTL;

/**
 * Swap values based on RTL layout
 * Useful for conditional values outside of hooks
 */
export const rtlSwap = <T,>(ltrValue: T, rtlValue: T): T => {
  return I18nManager.isRTL ? rtlValue : ltrValue;
};

/**
 * Get text alignment based on RTL
 */
export const getTextAlign = (): 'left' | 'right' => {
  return I18nManager.isRTL ? 'right' : 'left';
};

/**
 * Get flex direction for rows based on RTL
 */
export const getRowDirection = (): 'row' | 'row-reverse' => {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
};
