// SPENDTRAK CINEMATIC EDITION - Confirmation Modal Component
// Reusable themed confirmation dialog for delete and other destructive actions

import React, { useEffect } from 'react';
import { View, Modal, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../design/cinematic';
import { GradientText } from './GradientText';
import { WarningIcon, TrashIcon } from '../icons';

export type ConfirmationVariant = 'default' | 'danger' | 'warning' | 'info';

export interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  showIcon = true,
  icon,
}) => {
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const confirmButtonScale = useSharedValue(1);
  const cancelButtonScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.quad });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      modalOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 150 });
      modalScale.value = withTiming(0.9, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const confirmButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmButtonScale.value }],
  }));

  const cancelButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  // Get variant-specific colors
  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: Colors.semantic.error,
          iconBgColor: Colors.transparent.red10,
          confirmBg: [Colors.semantic.error, '#cc2952'] as const,
          confirmText: Colors.void,
          borderColor: `${Colors.semantic.error}30`,
        };
      case 'warning':
        return {
          iconColor: Colors.semantic.warning,
          iconBgColor: Colors.transparent.orange10,
          confirmBg: [Colors.semantic.warning, '#cc6d00'] as const,
          confirmText: Colors.void,
          borderColor: `${Colors.semantic.warning}30`,
        };
      case 'info':
      default:
        return {
          iconColor: Colors.neon,
          iconBgColor: Colors.transparent.neon10,
          confirmBg: Colors.gradients.buttonPrimary,
          confirmText: Colors.void,
          borderColor: Colors.transparent.neon30,
        };
    }
  };

  const colors = getVariantColors();

  // Get default icon based on variant
  const getDefaultIcon = () => {
    switch (variant) {
      case 'danger':
        return <TrashIcon size={32} color={colors.iconColor} />;
      case 'warning':
      case 'info':
      default:
        return <WarningIcon size={32} color={colors.iconColor} />;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          style={styles.backdropPressable}
          onPress={onClose}
          accessibilityLabel="Close dialog"
          accessibilityRole="button"
        />
      </Animated.View>

      {/* Modal Content */}
      <View
        style={styles.centeredView}
        accessibilityViewIsModal={true}
        accessibilityLabel="Confirmation dialog"
      >
        <Animated.View style={[styles.modalContainer, modalStyle]} accessibilityRole="alert">
          <LinearGradient
            colors={['#0a1a12', '#051a0f', Colors.void]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.modalGradient, { borderColor: colors.borderColor }]}
          >
            {/* Icon */}
            {showIcon && (
              <View
                style={[styles.iconContainer, { backgroundColor: colors.iconBgColor }]}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
              >
                {icon || getDefaultIcon()}
              </View>
            )}

            {/* Title */}
            <GradientText variant="bright" style={styles.title}>
              {title}
            </GradientText>

            {/* Message */}
            <GradientText variant="muted" style={styles.message}>
              {message}
            </GradientText>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {/* Cancel Button */}
              <AnimatedPressable
                onPress={onClose}
                onPressIn={() => { cancelButtonScale.value = withSpring(0.95); }}
                onPressOut={() => { cancelButtonScale.value = withSpring(1); }}
                style={[styles.button, styles.cancelButton, cancelButtonStyle]}
                accessibilityRole="button"
                accessibilityLabel={cancelText}
              >
                <GradientText variant="subtle" style={styles.cancelButtonText} numberOfLines={1}>
                  {cancelText}
                </GradientText>
              </AnimatedPressable>

              {/* Confirm Button */}
              <AnimatedPressable
                onPress={handleConfirm}
                onPressIn={() => { confirmButtonScale.value = withSpring(0.95); }}
                onPressOut={() => { confirmButtonScale.value = withSpring(1); }}
                style={[styles.button, confirmButtonStyle]}
                accessibilityRole="button"
                accessibilityLabel={confirmText}
              >
                <LinearGradient
                  colors={colors.confirmBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButtonGradient}
                >
                  <GradientText variant="bright" style={[styles.confirmButtonText, { color: colors.confirmText }]} numberOfLines={1}>
                    {confirmText}
                  </GradientText>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdropPressable: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  modalGradient: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    // Glow effect
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: Colors.border.active,
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confirmButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default ConfirmationModal;
