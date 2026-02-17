// SPENDTRAK - Offline Banner Component
// Displays a banner when user is offline

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../context/NetworkContext';
import { useTranslation } from '../../context/LanguageContext';
import { Colors } from '../../design/cinematic/colors';
import { FontFamily, FontSize } from '../../design/cinematic/typography';
import { Spacing } from '../../design/cinematic/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner: React.FC = memo(() => {
  const { isConnected, refresh } = useNetwork();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Only show when offline
  if (isConnected) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : Spacing.sm }
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name="cloud-offline-outline"
          size={18}
          color={Colors.background.primary}
        />
        <Text style={styles.text}>
          {t('common.offline')}
        </Text>
      </View>
      <Pressable
        onPress={refresh}
        style={styles.retryButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="refresh-outline"
          size={16}
          color={Colors.background.primary}
        />
      </Pressable>
    </Animated.View>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.semantic.warning,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: Colors.background.primary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  retryButton: {
    padding: Spacing.xs,
  },
});

export default OfflineBanner;
