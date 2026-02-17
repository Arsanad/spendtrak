/**
 * OptimizedList - High-performance FlatList wrapper
 * Provides consistent performance optimizations across the app
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  Platform,
  View,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { Colors, Spacing, FontSize } from '../../design/cinematic';
import { GradientText } from '../ui/GradientText';

// Base interface for items (requires id for keyExtractor)
interface BaseItem {
  id: string;
}

interface OptimizedListProps<T extends BaseItem>
  extends Omit<FlatListProps<T>, 'renderItem' | 'keyExtractor'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  itemHeight?: number; // For getItemLayout optimization (fixed height items)
  estimatedItemSize?: number; // For variable height items (hint for virtualization)
  emptyMessage?: string;
  emptySubMessage?: string;
}

/**
 * Default empty list component
 */
const DefaultEmptyComponent = memo(({
  message = 'No items',
  subMessage,
}: {
  message?: string;
  subMessage?: string;
}) => (
  <View style={styles.emptyContainer}>
    <GradientText variant="muted" style={styles.emptyText}>
      {message}
    </GradientText>
    {subMessage && (
      <GradientText variant="muted" style={styles.emptySubtext}>
        {subMessage}
      </GradientText>
    )}
  </View>
));

/**
 * OptimizedList - Performance-optimized FlatList wrapper
 *
 * Features:
 * - removeClippedSubviews for memory optimization (Android/iOS)
 * - Tuned batch rendering parameters
 * - Optimized window size for virtualization
 * - getItemLayout for fixed-height items (eliminates measurement)
 * - Memoized callbacks to prevent re-renders
 * - Default empty state component
 *
 * @example
 * // Fixed height items (best performance)
 * <OptimizedList
 *   data={transactions}
 *   renderItem={(item) => <TransactionRow {...item} />}
 *   itemHeight={72}
 * />
 *
 * @example
 * // Variable height items
 * <OptimizedList
 *   data={messages}
 *   renderItem={(item) => <MessageCard {...item} />}
 *   estimatedItemSize={100}
 * />
 */
function OptimizedListInner<T extends BaseItem>({
  data,
  renderItem,
  itemHeight,
  estimatedItemSize = 80,
  emptyMessage,
  emptySubMessage,
  ListEmptyComponent,
  ...props
}: OptimizedListProps<T>) {
  // Memoized key extractor
  const keyExtractor = useCallback((item: T) => item.id, []);

  // Memoized render item wrapper
  const renderItemCallback = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => renderItem(item, index),
    [renderItem]
  );

  // Optimized getItemLayout (only when itemHeight is known/fixed)
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    return (_: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  // Default empty component
  const emptyComponent = useMemo(() => {
    if (ListEmptyComponent) return ListEmptyComponent;
    if (emptyMessage) {
      return (
        <DefaultEmptyComponent
          message={emptyMessage}
          subMessage={emptySubMessage}
        />
      );
    }
    return null;
  }, [ListEmptyComponent, emptyMessage, emptySubMessage]);

  return (
    <FlatList
      data={data}
      renderItem={renderItemCallback}
      keyExtractor={keyExtractor}
      ListEmptyComponent={emptyComponent}
      // Performance optimizations
      removeClippedSubviews={Platform.OS !== 'web'}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
      updateCellsBatchingPeriod={50}
      // Only use getItemLayout if itemHeight is provided
      {...(getItemLayout && { getItemLayout })}
      // Disable scroll indicators for cleaner UI
      showsVerticalScrollIndicator={false}
      // Pass through other props
      {...props}
    />
  );
}

/**
 * Optimized SectionList wrapper
 */
export interface OptimizedSectionListProps<T extends BaseItem, SectionT> {
  sections: ReadonlyArray<{ title: string; data: ReadonlyArray<T> } & SectionT>;
  renderItem: (item: T, index: number) => React.ReactElement;
  renderSectionHeader?: (title: string) => React.ReactElement;
  itemHeight?: number;
  sectionHeaderHeight?: number;
}

// Export memoized component with proper generic typing
export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

// Re-export for convenience
export type { OptimizedListProps };

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FontSize.body,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default OptimizedList;
