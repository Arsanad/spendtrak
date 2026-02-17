/**
 * OptimizedList - Performance-optimized FlatList wrapper
 * Features: Staggered animations, smooth scrolling, refresh control
 */
import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  StyleSheet,
  View,
  RefreshControl,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { TIMING } from '@/config/animations';
import { Colors } from '@/design/cinematic';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  staggeredAnimation?: boolean;
}

function OptimizedListInner<T extends { id: string | number }>({
  data,
  renderItem,
  itemHeight = 80,
  onRefresh,
  isRefreshing = false,
  emptyComponent,
  headerComponent,
  footerComponent,
  staggeredAnimation = true,
  ...props
}: OptimizedListProps<T>) {
  const scrollY = useSharedValue(0);

  // Optimized scroll handler - runs on UI thread
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Memoized key extractor
  const keyExtractor = useCallback((item: T) => String(item.id), []);

  // Memoized getItemLayout for fixed height items
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  // Memoized render item with animation
  const renderAnimatedItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return (
        <Animated.View
          entering={
            staggeredAnimation
              ? FadeIn.delay(index * TIMING.listItemStagger).duration(
                  TIMING.listItemDuration
                )
              : FadeIn.duration(TIMING.listItemDuration)
          }
          layout={Layout.springify().damping(15).stiffness(100)}
          style={styles.itemContainer}
        >
          {renderItem(item, index)}
        </Animated.View>
      );
    },
    [renderItem, staggeredAnimation]
  );

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

  // Empty component wrapper
  const ListEmptyComponent = useMemo(() => {
    if (!emptyComponent) return null;
    return (
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={styles.emptyContainer}
      >
        {emptyComponent}
      </Animated.View>
    );
  }, [emptyComponent]);

  return (
    <AnimatedFlatList
      data={data as any}
      renderItem={renderAnimatedItem as any}
      keyExtractor={keyExtractor as any}
      getItemLayout={getItemLayout as any}
      onScroll={scrollHandler}
      scrollEventThrottle={16} // 60fps

      // Performance optimizations
      removeClippedSubviews={Platform.OS !== 'web'}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      windowSize={5}
      updateCellsBatchingPeriod={50}

      // Smooth scrolling
      decelerationRate="normal"
      overScrollMode="never"
      showsVerticalScrollIndicator={false}

      // Components
      ListHeaderComponent={headerComponent as any}
      ListFooterComponent={footerComponent as any}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={refreshControl}

      // Maintain position
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}

      // Content styling
      contentContainerStyle={[
        styles.contentContainer,
        data.length === 0 && styles.emptyContentContainer,
      ]}

      {...props}
    />
  );
}

export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100, // Space for tab bar
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  itemContainer: {
    // Will inherit item styles
  },
});
