/**
 * SmoothScrollView - Premium smooth scrolling wrapper
 * Features: Momentum scrolling, fade edges, pull-to-refresh
 */
import React, { memo, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ViewStyle,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors } from '@/design/cinematic';

interface SmoothScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  showFadeEdges?: boolean;
  fadeEdgeHeight?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  bounces?: boolean;
  showsVerticalScrollIndicator?: boolean;
}

export const SmoothScrollView = memo(
  ({
    children,
    style,
    contentContainerStyle,
    onRefresh,
    isRefreshing = false,
    showFadeEdges = false,
    fadeEdgeHeight = 40,
    onScroll,
    scrollEventThrottle = 16,
    bounces = true,
    showsVerticalScrollIndicator = false,
  }: SmoothScrollViewProps) => {
    const scrollY = useSharedValue(0);
    const contentHeight = useSharedValue(0);
    const containerHeight = useSharedValue(0);

    // Optimized scroll handler - runs on UI thread
    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
        contentHeight.value = event.contentSize.height;
        containerHeight.value = event.layoutMeasurement.height;
      },
    });

    // Top fade edge animation
    const topFadeStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [0, fadeEdgeHeight],
        [0, 1],
        Extrapolation.CLAMP
      );
      return { opacity };
    });

    // Bottom fade edge animation
    const bottomFadeStyle = useAnimatedStyle(() => {
      const maxScroll = contentHeight.value - containerHeight.value;
      const opacity = interpolate(
        scrollY.value,
        [maxScroll - fadeEdgeHeight, maxScroll],
        [1, 0],
        Extrapolation.CLAMP
      );
      return { opacity };
    });

    // Memoized refresh control
    const refreshControl = useMemo(() => {
      if (!onRefresh) return undefined;

      return (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.neon}
          colors={[Colors.neon]}
          progressBackgroundColor={Colors.darker}
        />
      );
    }, [onRefresh, isRefreshing]);

    // Handle native scroll event forwarding
    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        onScroll?.(event);
      },
      [onScroll]
    );

    return (
      <Animated.View style={[styles.container, style]}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={scrollEventThrottle}
          bounces={bounces}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          overScrollMode="never"
          decelerationRate="normal"
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          refreshControl={refreshControl}
        >
          {children}
        </Animated.ScrollView>

        {/* Fade edges */}
        {showFadeEdges && (
          <>
            <Animated.View
              style={[
                styles.fadeEdge,
                styles.topFade,
                { height: fadeEdgeHeight },
                topFadeStyle,
              ]}
              pointerEvents="none"
            />
            <Animated.View
              style={[
                styles.fadeEdge,
                styles.bottomFade,
                { height: fadeEdgeHeight },
                bottomFadeStyle,
              ]}
              pointerEvents="none"
            />
          </>
        )}
      </Animated.View>
    );
  }
);

SmoothScrollView.displayName = 'SmoothScrollView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    paddingBottom: 100, // Space for tab bar
  },
  fadeEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topFade: {
    top: 0,
    backgroundColor: Colors.void,
  },
  bottomFade: {
    bottom: 0,
    backgroundColor: Colors.void,
  },
});
