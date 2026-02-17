/**
 * SpendTrak Header Component
 * Reusable header with left/right actions and title
 *
 * Features:
 * - Safe area aware (handles notch)
 * - Left and right action buttons
 * - Title and subtitle support
 * - Multiple variants (default, transparent, bordered)
 * - Optional gradient title
 *
 * @example
 * // Basic header with back button
 * <Header
 *   title="Settings"
 *   leftAction={{ icon: <BackIcon />, onPress: goBack }}
 * />
 *
 * // Header with left and right actions
 * <Header
 *   title="Transactions"
 *   leftAction={{ icon: <MenuIcon />, onPress: openDrawer }}
 *   rightAction={{ icon: <FilterIcon />, onPress: openFilter }}
 * />
 *
 * // Welcome header with subtitle
 * <Header
 *   subtitle="Welcome back"
 *   title="Abdelrahman"
 *   variant="transparent"
 *   useGradientTitle
 * />
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderWidth, FontFamily, FontSize } from '@/design/cinematic';
import { zIndex, Layout } from '@/theme';
import { Text } from '@/components/ui/Text';
import { GradientText, GradientTitle } from '@/components/ui/GradientText';

// ===== TYPES =====
export type HeaderVariant = 'default' | 'transparent' | 'bordered' | 'elevated';

export interface HeaderAction {
  /** Icon to display */
  icon: ReactNode;
  /** Press handler */
  onPress: () => void;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface HeaderProps {
  /** Header title */
  title?: string;

  /** Subtitle (displayed above title) */
  subtitle?: string;

  /** Left action button */
  leftAction?: HeaderAction;

  /** Right action button */
  rightAction?: HeaderAction;

  /** Additional right actions (max 2) */
  additionalRightActions?: HeaderAction[];

  /** Visual variant */
  variant?: HeaderVariant;

  /** Use gradient text for title */
  useGradientTitle?: boolean;

  /** Custom title component */
  customTitle?: ReactNode;

  /** Hide safe area top padding */
  noSafeArea?: boolean;

  /** Additional style */
  style?: ViewStyle;
}

// ===== ANIMATED BUTTON =====
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HeaderButton: React.FC<{
  action: HeaderAction;
  position: 'left' | 'right';
}> = ({ action, position }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!action.disabled) {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={action.disabled ? undefined : action.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.iconButton,
        position === 'left' ? styles.iconButtonLeft : styles.iconButtonRight,
        action.disabled && styles.iconButtonDisabled,
        animatedStyle,
      ]}
      accessibilityLabel={action.accessibilityLabel}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {action.icon}
    </AnimatedPressable>
  );
};

// ===== MAIN COMPONENT =====
export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  additionalRightActions,
  variant = 'default',
  useGradientTitle = false,
  customTitle,
  noSafeArea = false,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = noSafeArea ? 0 : insets.top;

  const variantStyles = getVariantStyles(variant);

  // Render title
  const renderTitle = () => {
    if (customTitle) return customTitle;

    if (!title && !subtitle) return null;

    return (
      <View style={styles.titleContainer}>
        {subtitle && (
          <GradientText variant="muted" style={styles.subtitle}>
            {subtitle}
          </GradientText>
        )}
        {title && (
          useGradientTitle ? (
            <GradientTitle style={styles.title}>{title}</GradientTitle>
          ) : (
            <Text variant="h3" color="primary" style={styles.title}>
              {title}
            </Text>
          )
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        variantStyles.container,
        { paddingTop: topPadding },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {leftAction && <HeaderButton action={leftAction} position="left" />}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          {renderTitle()}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {additionalRightActions?.map((action, index) => (
            <HeaderButton
              key={`additional-${index}`}
              action={action}
              position="right"
            />
          ))}
          {rightAction && <HeaderButton action={rightAction} position="right" />}
        </View>
      </View>
    </View>
  );
};

// ===== VARIANT STYLES =====
const getVariantStyles = (variant: HeaderVariant): { container: ViewStyle } => {
  switch (variant) {
    case 'transparent':
      return {
        container: {
          backgroundColor: 'transparent',
          borderBottomWidth: 0,
        },
      };
    case 'bordered':
      return {
        container: {
          backgroundColor: Colors.background.primary,
          borderBottomWidth: BorderWidth.thin,
          borderBottomColor: Colors.border.subtle,
        },
      };
    case 'elevated':
      return {
        container: {
          backgroundColor: Colors.background.secondary,
          borderBottomWidth: 0,
          shadowColor: Colors.neon,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
      };
    default:
      return {
        container: {
          backgroundColor: Colors.background.primary,
          borderBottomWidth: BorderWidth.hairline,
          borderBottomColor: Colors.border.subtle,
        },
      };
  }
};

// ===== PRE-STYLED VARIANTS =====

/** Back header with title */
export const BackHeader: React.FC<{
  title: string;
  onBack: () => void;
  rightAction?: HeaderAction;
}> = ({ title, onBack, rightAction }) => (
  <Header
    title={title}
    leftAction={{
      icon: <BackArrowIcon />,
      onPress: onBack,
      accessibilityLabel: 'Go back',
    }}
    rightAction={rightAction}
  />
);

/** Welcome header (Dashboard style) */
export const WelcomeHeader: React.FC<{
  name: string;
  subtitle?: string;
  leftAction?: HeaderAction;
}> = ({ name, subtitle = 'Welcome back', leftAction }) => (
  <Header
    subtitle={subtitle}
    title={name}
    variant="transparent"
    useGradientTitle
    leftAction={leftAction}
  />
);

/** Simple placeholder for back arrow icon */
const BackArrowIcon = () => (
  <Text variant="body" color="primary">{'<'}</Text>
);

const styles = StyleSheet.create({
  container: {
    zIndex: zIndex.header,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.headerHeight,
    paddingHorizontal: Spacing.md,
  },
  leftSection: {
    minWidth: 52,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    minWidth: 52,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xxs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent.dark40,
  },
  iconButtonLeft: {
    marginRight: Spacing.xs,
  },
  iconButtonRight: {
    marginLeft: Spacing.xs,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
});

export default Header;
