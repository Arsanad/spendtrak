/**
 * Performance Utilities
 * Hooks and utilities for optimizing app performance
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import type { FlatListProps } from 'react-native';
import { logger } from './logger';

/**
 * Debounce Hook
 * Delays execution of a function until after a specified delay
 * Useful for search inputs, API calls, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: unknown[]) => unknown;

export function useDebounce<T extends AnyFunction>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttle Hook
 * Ensures function is called at most once per specified interval
 * Useful for scroll handlers, resize events, etc.
 */
export function useThrottle<T extends AnyFunction>(
  callback: T,
  limit: number
): T {
  const lastRunRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        return callbackRef.current(...args);
      }
    }) as T,
    [limit]
  );
}

/**
 * Optimized FlatList Props
 * Common performance optimizations for FlatList components
 */
export const optimizedListProps: Partial<FlatListProps<unknown>> = {
  // Reduce initial render batch
  initialNumToRender: 10,

  // Control batch rendering
  maxToRenderPerBatch: 10,

  // Render items ahead of visible area
  windowSize: 5,

  // Remove items far from viewport
  removeClippedSubviews: true,

  // Update cells outside viewport less frequently
  updateCellsBatchingPeriod: 50,

  // Maintain visible content during updates
  maintainVisibleContentPosition: {
    minIndexForVisible: 0,
  },
};

/**
 * Get optimized list props with custom configuration
 */
export function getOptimizedListProps(options?: {
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
}): Partial<FlatListProps<unknown>> {
  return {
    ...optimizedListProps,
    initialNumToRender: options?.initialNumToRender ?? 10,
    maxToRenderPerBatch: options?.maxToRenderPerBatch ?? 10,
    windowSize: options?.windowSize ?? 5,
  };
}

/**
 * Memoized Item Height Calculator
 * Returns consistent item heights for getItemLayout optimization
 */
export function createGetItemLayout(itemHeight: number, headerHeight = 0) {
  return (_data: unknown, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index + headerHeight,
    index,
  });
}

/**
 * Previous Value Hook
 * Returns the previous value of a state/prop
 * Useful for comparison-based optimizations
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Deep Comparison Memo
 * Memoizes a value with deep comparison instead of reference equality
 * Use sparingly as deep comparison can be expensive
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | undefined>(undefined);

  if (!ref.current || !isDeepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * Simple deep equality check
 */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isDeepEqual(objA[key], objB[key])) return false;
  }

  return true;
}

/**
 * Lazy Initialization Hook
 * Defers expensive computations until they're needed
 */
export function useLazy<T>(factory: () => T): () => T {
  const ref = useRef<{ value: T; initialized: boolean }>({
    value: undefined as T,
    initialized: false,
  });

  return useCallback(() => {
    if (!ref.current.initialized) {
      ref.current.value = factory();
      ref.current.initialized = true;
    }
    return ref.current.value;
  }, [factory]);
}

/**
 * Mounted Check Hook
 * Prevents state updates on unmounted components
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Performance Timing Hook (Development Only)
 * Measures render times for performance debugging
 */
export function useRenderTiming(componentName: string): void {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (__DEV__) {
      renderCount.current += 1;
      const renderTime = Date.now() - startTime.current;

      if (renderTime > 16) {
        logger.performance.warn(
          `${componentName} render #${renderCount.current} took ${renderTime}ms`
        );
      }
    }
  });

  // Reset timer on each render
  startTime.current = Date.now();
}
