/**
 * SpendTrak ScreenContainer Component
 * Standard container for all screens with consistent styling
 *
 * Features:
 * - Safe area handling (notch, home indicator)
 * - Consistent background color
 * - Optional scrolling
 * - Optional padding
 * - Fog effect support
 *
 * @example
 * // Basic usage
 * <ScreenContainer>
 *   <Text>Content</Text>
 * </ScreenContainer>
 *
 * // Scrollable with no padding
 * <ScreenContainer scrollable padding={false}>
 *   <TransactionList />
 * </ScreenContainer>
 *
 * // With fog effect
 * <ScreenContainer fog>
 *   <Dashboard />
 * </ScreenContainer>
 */

import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, ViewStyle, ScrollViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/design/cinematic';
import { zIndex } from '@/theme';

// ===== TYPES =====
export interface ScreenContainerProps {
  children: ReactNode;

  /**
   * Enable scrolling for content
   * @default false
   */
  scrollable?: boolean;

  /**
   * Apply screen padding
   * @default true
   */
  padding?: boolean;

  /**
   * Custom padding value (overrides default)
   */
  customPadding?: number;

  /**
   * Enable safe area handling
   * @default true
   */
  safeArea?: boolean;

  /**
   * Which edges to apply safe area to
   * @default ['top', 'bottom']
   */
  safeAreaEdges?: Edge[];

  /**
   * Show atmospheric fog effect
   * @default false
   */
  fog?: boolean;

  /**
   * Background color override
   */
  backgroundColor?: string;

  /**
   * Status bar style
   * @default 'light-content'
   */
  statusBarStyle?: 'light-content' | 'dark-content';

  /**
   * Additional container style
   */
  style?: ViewStyle;

  /**
   * Additional content style
   */
  contentStyle?: ViewStyle;

  /**
   * ScrollView props when scrollable is true
   */
  scrollViewProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;

  /**
   * Keyboard avoiding behavior
   * @default false
   */
  keyboardAvoiding?: boolean;

  /**
   * Header component to render at top (outside scroll area)
   */
  header?: ReactNode;

  /**
   * Footer component to render at bottom (outside scroll area)
   */
  footer?: ReactNode;
}

// ===== COMPONENT =====
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  padding = true,
  customPadding,
  safeArea = true,
  safeAreaEdges = ['top', 'bottom'],
  fog = false,
  backgroundColor = Colors.background.primary,
  statusBarStyle = 'light-content',
  style,
  contentStyle,
  scrollViewProps,
  header,
  footer,
}) => {
  const insets = useSafeAreaInsets();

  // Calculate padding
  const paddingValue = customPadding ?? (padding ? Spacing.lg : 0);

  // Container component based on safe area setting
  const Container = safeArea ? SafeAreaView : View;
  const containerProps = safeArea ? { edges: safeAreaEdges } : {};

  // Content wrapper based on scrollable setting
  const renderContent = () => {
    const contentPadding: ViewStyle = {
      paddingHorizontal: paddingValue,
      paddingBottom: paddingValue,
    };

    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            contentPadding,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.content, contentPadding, contentStyle]}>
        {children}
      </View>
    );
  };

  return (
    <Container
      style={[styles.container, { backgroundColor }, style]}
      {...containerProps}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={backgroundColor}
        translucent={false}
      />

      {/* Optional fog effect */}
      {fog && <View style={styles.fogContainer} pointerEvents="none" />}

      {/* Optional header */}
      {header}

      {/* Main content */}
      {renderContent()}

      {/* Optional footer */}
      {footer}
    </Container>
  );
};

// ===== PRE-STYLED VARIANTS =====

/** Screen with scrollable content */
export const ScrollableScreen: React.FC<Omit<ScreenContainerProps, 'scrollable'>> = (props) => (
  <ScreenContainer scrollable {...props} />
);

/** Screen with no padding (full bleed) */
export const FullBleedScreen: React.FC<Omit<ScreenContainerProps, 'padding'>> = (props) => (
  <ScreenContainer padding={false} {...props} />
);

/** Modal screen (no safe area on top) */
export const ModalScreen: React.FC<Omit<ScreenContainerProps, 'safeAreaEdges'>> = (props) => (
  <ScreenContainer safeAreaEdges={['bottom']} {...props} />
);

/** Screen with fog effect */
export const FoggyScreen: React.FC<Omit<ScreenContainerProps, 'fog'>> = (props) => (
  <ScreenContainer fog {...props} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    zIndex: zIndex.base,
    // Fog gradient would be applied via a separate component
  },
});

export default ScreenContainer;
