// SPENDTRAK CINEMATIC EDITION - Page Skeleton Loading
// Premium shimmer loading states

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../design/cinematic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shimmer skeleton block component
interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        { width: width as any, height, borderRadius },
        shimmerStyle,
        style,
      ]}
    />
  );
};

// Card skeleton for common card layouts
export const SkeletonCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.skeletonCard, style]}>
      <SkeletonBlock height={24} width="60%" style={styles.marginBottom} />
      <SkeletonBlock height={48} style={styles.marginBottom} />
      <View style={styles.row}>
        <SkeletonBlock width="45%" height={16} />
        <SkeletonBlock width="35%" height={16} />
      </View>
    </View>
  );
};

// List item skeleton
export const SkeletonListItem: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonBlock width={44} height={44} borderRadius={22} />
      <View style={styles.listItemContent}>
        <SkeletonBlock height={16} width="70%" style={styles.marginBottomSm} />
        <SkeletonBlock height={12} width="40%" />
      </View>
      <SkeletonBlock width={60} height={20} />
    </View>
  );
};

// Full page skeleton with header and content
export const PageSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header area */}
      <View style={styles.header}>
        <SkeletonBlock width={120} height={28} />
      </View>

      {/* Main card */}
      <SkeletonCard style={styles.mainCard} />

      {/* Section title */}
      <SkeletonBlock width={100} height={14} style={styles.sectionTitle} />

      {/* List items */}
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  );
};

// Home screen specific skeleton
export const HomePageSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Balance card */}
      <View style={[styles.skeletonCard, styles.balanceCard]}>
        <SkeletonBlock width={80} height={14} style={styles.marginBottom} />
        <SkeletonBlock width={160} height={36} style={styles.marginBottom} />
        <View style={styles.row}>
          <View style={styles.flex1}>
            <SkeletonBlock width={60} height={12} style={styles.marginBottomSm} />
            <SkeletonBlock width={80} height={20} />
          </View>
          <View style={styles.flex1}>
            <SkeletonBlock width={60} height={12} style={styles.marginBottomSm} />
            <SkeletonBlock width={80} height={20} />
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <SkeletonBlock width={70} height={70} borderRadius={16} />
        <SkeletonBlock width={70} height={70} borderRadius={16} />
        <SkeletonBlock width={70} height={70} borderRadius={16} />
        <SkeletonBlock width={70} height={70} borderRadius={16} />
      </View>

      {/* Recent transactions */}
      <SkeletonBlock width={140} height={14} style={styles.sectionTitle} />
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  );
};

// Stats/Analytics page skeleton
export const StatsPageSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Chart area */}
      <View style={[styles.skeletonCard, styles.chartCard]}>
        <View style={styles.chartHeader}>
          <SkeletonBlock width={100} height={14} />
          <SkeletonBlock width={80} height={24} />
        </View>
        <SkeletonBlock height={180} style={styles.chart} />
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <SkeletonBlock width={40} height={12} style={styles.marginBottomSm} />
          <SkeletonBlock width={60} height={20} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBlock width={40} height={12} style={styles.marginBottomSm} />
          <SkeletonBlock width={60} height={20} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBlock width={40} height={12} style={styles.marginBottomSm} />
          <SkeletonBlock width={60} height={20} />
        </View>
      </View>

      {/* Category breakdown */}
      <SkeletonBlock width={140} height={14} style={styles.sectionTitle} />
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  );
};

// Settings page skeleton
export const SettingsPageSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.settingsHeader}>
        <SkeletonBlock width={40} height={40} borderRadius={20} />
        <SkeletonBlock width={150} height={24} />
      </View>

      {/* Section */}
      <SkeletonBlock width={100} height={12} style={styles.sectionTitle} />
      <View style={styles.settingsCard}>
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </View>

      {/* Section */}
      <SkeletonBlock width={80} height={12} style={styles.sectionTitle} />
      <View style={styles.settingsCard}>
        <SkeletonListItem />
        <SkeletonListItem />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
    padding: Spacing.lg,
  },
  skeletonBlock: {
    backgroundColor: Colors.transparent.neon10,
  },
  skeletonCard: {
    backgroundColor: Colors.transparent.darker60,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.transparent.neon10,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  mainCard: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.transparent.darker40,
    borderRadius: BorderRadius.md,
  },
  listItemContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  marginBottom: {
    marginBottom: Spacing.md,
  },
  marginBottomSm: {
    marginBottom: Spacing.xs,
  },

  // Home specific
  balanceCard: {
    paddingVertical: Spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },

  // Stats specific
  chartCard: {
    paddingBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chart: {
    borderRadius: BorderRadius.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.transparent.darker40,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
  },

  // Settings specific
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  settingsCard: {
    backgroundColor: Colors.transparent.darker40,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
});

export default PageSkeleton;
