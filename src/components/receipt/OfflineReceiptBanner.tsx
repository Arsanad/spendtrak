/**
 * Offline Receipt Banner Component
 * Shows pending receipts count, processing status, and tap to view queue
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '@/design/cinematic';
import { GradientText } from '@/components/ui/GradientText';
import { useReceiptStore } from '@/stores/receiptStore';
import { lightTap } from '@/utils/haptics';

export interface OfflineReceiptBannerProps {
  onPress?: () => void;
  style?: object;
}

export const OfflineReceiptBanner: React.FC<OfflineReceiptBannerProps> = memo(({
  onPress,
  style,
}) => {
  const {
    pendingReceiptsCount,
    processingCount,
    failedCount,
    isProcessingQueue,
    isOnline,
  } = useReceiptStore();

  // Animation values
  const pulseOpacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Pulse animation when processing
  useEffect(() => {
    if (isProcessingQueue) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isProcessingQueue]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    lightTap();
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  // Don't render if nothing in queue
  const totalInQueue = pendingReceiptsCount + processingCount + failedCount;
  if (totalInQueue === 0) {
    return null;
  }

  // Determine banner state and message
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: 'cloud-offline-outline' as const,
        iconColor: Colors.semantic.warning,
        message: `${totalInQueue} receipt${totalInQueue > 1 ? 's' : ''} waiting for connection`,
        subMessage: 'Will upload when back online',
      };
    }

    if (isProcessingQueue) {
      return {
        icon: 'cloud-upload-outline' as const,
        iconColor: Colors.neon,
        message: `Uploading ${processingCount} receipt${processingCount > 1 ? 's' : ''}...`,
        subMessage: `${pendingReceiptsCount} remaining`,
      };
    }

    if (failedCount > 0) {
      return {
        icon: 'warning-outline' as const,
        iconColor: Colors.semantic.error,
        message: `${failedCount} receipt${failedCount > 1 ? 's' : ''} failed`,
        subMessage: 'Tap to retry',
      };
    }

    return {
      icon: 'time-outline' as const,
      iconColor: Colors.text.tertiary,
      message: `${pendingReceiptsCount} receipt${pendingReceiptsCount > 1 ? 's' : ''} pending`,
      subMessage: 'Tap to view queue',
    };
  };

  const { icon, iconColor, message, subMessage } = getStatusInfo();

  return (
    <Animated.View style={[styles.container, animatedScaleStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${message}. ${subMessage}`}
        accessibilityHint="Tap to view receipt queue"
      >
        <Animated.View style={[styles.content, animatedPulseStyle]}>
          {/* Icon / Spinner */}
          <View style={styles.iconContainer}>
            {isProcessingQueue ? (
              <ActivityIndicator size="small" color={Colors.neon} />
            ) : (
              <Ionicons name={icon} size={20} color={iconColor} />
            )}
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <GradientText
              variant={failedCount > 0 ? 'expense' : isProcessingQueue ? 'bright' : 'subtle'}
              style={styles.message}
            >
              {message}
            </GradientText>
            <GradientText variant="muted" style={styles.subMessage}>
              {subMessage}
            </GradientText>
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.text.tertiary}
          />
        </Animated.View>

        {/* Progress bar when processing */}
        {isProcessingQueue && totalInQueue > 0 && (
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: `${((totalInQueue - pendingReceiptsCount) / totalInQueue) * 100}%`,
                },
                animatedPulseStyle,
              ]}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

OfflineReceiptBanner.displayName = 'OfflineReceiptBanner';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  pressable: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
  subMessage: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  progressContainer: {
    height: 2,
    backgroundColor: Colors.background.secondary,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.neon,
  },
});

export default OfflineReceiptBanner;
