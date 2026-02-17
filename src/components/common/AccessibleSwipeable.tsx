// SPENDTRAK CINEMATIC EDITION - Accessible Swipeable Component
// Provides keyboard/button alternatives for swipe gestures to improve accessibility

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  Pressable,
  LayoutAnimation,
  Platform,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../design/cinematic';
import { TrashIcon, EditIcon, CheckIcon, CloseIcon } from '../icons';
import { triggerHaptic } from '../../utils/haptics';

// Default swipe threshold
const SWIPE_THRESHOLD = 100;

export interface SwipeAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export interface AccessibleSwipeableProps {
  children: React.ReactNode;
  /** Actions shown when swiping left (appear on right side) */
  rightActions?: SwipeAction[];
  /** Actions shown when swiping right (appear on left side) */
  leftActions?: SwipeAction[];
  /** Callback when long press triggers action menu */
  onLongPress?: () => void;
  /** Whether to show action buttons below content for screen readers */
  showAccessibleActions?: boolean;
  /** Custom swipe threshold in pixels */
  swipeThreshold?: number;
  /** Called when swipe starts */
  onSwipeStart?: () => void;
  /** Called when swipe is cancelled */
  onSwipeCancel?: () => void;
  /** Reset swipe position externally */
  resetSwipe?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Accessibility label for the entire row */
  accessibilityLabel?: string;
  /** Accessibility hint for the entire row */
  accessibilityHint?: string;
}

// Pre-built action creators for common use cases
export const createDeleteAction = (onDelete: () => void, label = 'Delete'): SwipeAction => ({
  key: 'delete',
  label,
  icon: <TrashIcon size={20} color={Colors.void} />,
  color: Colors.void,
  backgroundColor: Colors.semantic.error,
  onPress: onDelete,
  accessibilityLabel: label,
  accessibilityHint: 'Double tap to delete this item',
});

export const createEditAction = (onEdit: () => void, label = 'Edit'): SwipeAction => ({
  key: 'edit',
  label,
  icon: <EditIcon size={20} color={Colors.void} />,
  color: Colors.void,
  backgroundColor: Colors.semantic.info,
  onPress: onEdit,
  accessibilityLabel: label,
  accessibilityHint: 'Double tap to edit this item',
});

export const createArchiveAction = (onArchive: () => void, label = 'Archive'): SwipeAction => ({
  key: 'archive',
  label,
  icon: <CheckIcon size={20} color={Colors.void} />,
  color: Colors.void,
  backgroundColor: Colors.semantic.success,
  onPress: onArchive,
  accessibilityLabel: label,
  accessibilityHint: 'Double tap to archive this item',
});

// Action button component for accessible mode
const ActionButton = memo(({ action }: { action: SwipeAction }) => (
  <Pressable
    style={[styles.actionButton, { backgroundColor: action.backgroundColor }]}
    onPress={() => {
      triggerHaptic('light');
      action.onPress();
    }}
    accessibilityLabel={action.accessibilityLabel}
    accessibilityHint={action.accessibilityHint}
    accessibilityRole="button"
  >
    {action.icon}
    <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
  </Pressable>
));

// Swipe action panel component
const SwipeActionPanel = memo(({
  actions,
  side,
  translateX,
  threshold,
}: {
  actions: SwipeAction[];
  side: 'left' | 'right';
  translateX: SharedValue<number>;
  threshold: number;
}) => {
  const panelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, threshold / 2, threshold],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, threshold / 2, threshold],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View
      style={[
        styles.actionPanel,
        side === 'left' ? styles.leftPanel : styles.rightPanel,
        { backgroundColor: actions[0]?.backgroundColor || Colors.semantic.error },
        panelStyle,
      ]}
    >
      {actions.map((action) => (
        <Animated.View key={action.key} style={[styles.swipeActionIcon, iconStyle]}>
          {action.icon}
          <Text style={[styles.swipeActionLabel, { color: action.color }]}>{action.label}</Text>
        </Animated.View>
      ))}
    </Animated.View>
  );
});

export const AccessibleSwipeable = memo(({
  children,
  rightActions = [],
  leftActions = [],
  onLongPress,
  showAccessibleActions: forceShowActions,
  swipeThreshold = SWIPE_THRESHOLD,
  onSwipeStart,
  onSwipeCancel,
  resetSwipe,
  style,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: AccessibleSwipeableProps) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const translateX = useSharedValue(0);

  // Detect screen reader
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    return () => subscription.remove();
  }, []);

  // Reset swipe when requested
  useEffect(() => {
    if (resetSwipe) {
      translateX.value = withSpring(0, { damping: 15 });
    }
  }, [resetSwipe, translateX]);

  // Handle long press to show actions
  const handleLongPress = useCallback(() => {
    if (disabled) return;

    triggerHaptic('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowActions((prev) => !prev);
    onLongPress?.();
  }, [disabled, onLongPress]);

  // Hide actions
  const hideActions = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowActions(false);
  }, []);

  // Pan gesture for swipe
  const panGesture = Gesture.Pan()
    .enabled(!disabled && !isScreenReaderEnabled)
    .activeOffsetX([-10, 10])
    .onStart(() => {
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    })
    .onUpdate((event) => {
      // Allow swiping in either direction based on available actions
      if (event.translationX > 0 && leftActions.length > 0) {
        translateX.value = event.translationX;
      } else if (event.translationX < 0 && rightActions.length > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const threshold = swipeThreshold;

      // Swipe right (left actions)
      if (event.translationX > threshold && leftActions.length > 0) {
        runOnJS(triggerHaptic)('success');
        runOnJS(leftActions[0].onPress)();
        translateX.value = withTiming(0, { duration: 200 });
      }
      // Swipe left (right actions)
      else if (event.translationX < -threshold && rightActions.length > 0) {
        runOnJS(triggerHaptic)('success');
        runOnJS(rightActions[0].onPress)();
        translateX.value = withTiming(0, { duration: 200 });
      }
      // Cancel swipe
      else {
        if (onSwipeCancel) {
          runOnJS(onSwipeCancel)();
        }
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const allActions = [...leftActions, ...rightActions];
  const shouldShowAccessibleActions = forceShowActions || isScreenReaderEnabled || showActions;

  // Screen reader mode: show buttons directly
  if (isScreenReaderEnabled && allActions.length > 0) {
    return (
      <View style={[styles.container, style]}>
        <View
          accessible={true}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint || 'Actions available below'}
          accessibilityRole="button"
        >
          {children}
        </View>
        <View style={styles.accessibleActionsRow}>
          {allActions.map((action) => (
            <ActionButton key={action.key} action={action} />
          ))}
        </View>
      </View>
    );
  }

  // Regular mode with swipe + long press alternative
  return (
    <View style={[styles.container, style]}>
      {/* Left action panel (swipe right) */}
      {leftActions.length > 0 && (
        <SwipeActionPanel
          actions={leftActions}
          side="left"
          translateX={translateX}
          threshold={swipeThreshold}
        />
      )}

      {/* Right action panel (swipe left) */}
      {rightActions.length > 0 && (
        <SwipeActionPanel
          actions={rightActions}
          side="right"
          translateX={translateX}
          threshold={swipeThreshold}
        />
      )}

      {/* Swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={500}
            disabled={disabled}
            accessible={true}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={
              accessibilityHint ||
              (allActions.length > 0
                ? 'Swipe or long press for actions'
                : undefined)
            }
            accessibilityRole="button"
          >
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Long press action buttons */}
      {shouldShowAccessibleActions && allActions.length > 0 && !isScreenReaderEnabled && (
        <View style={styles.longPressActionsContainer}>
          <View style={styles.longPressActionsRow}>
            {allActions.map((action) => (
              <ActionButton key={action.key} action={action} />
            ))}
            <Pressable
              style={styles.cancelButton}
              onPress={hideActions}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <CloseIcon size={16} color={Colors.text.tertiary} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
});

AccessibleSwipeable.displayName = 'AccessibleSwipeable';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  leftPanel: {
    left: 0,
    right: '50%',
  },
  rightPanel: {
    right: 0,
    left: '50%',
  },
  swipeActionIcon: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  swipeActionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accessibleActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    backgroundColor: Colors.transparent.dark40,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  longPressActionsContainer: {
    marginTop: Spacing.xs,
  },
  longPressActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    backgroundColor: Colors.transparent.dark60,
    borderRadius: BorderRadius.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

export default AccessibleSwipeable;
