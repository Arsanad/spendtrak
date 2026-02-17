/**
 * Custom Hooks
 * Export all custom hooks for easy importing
 */

// Utility hooks
export { useDebounce } from './useDebounce';
export { useRefresh } from './useRefresh';
export { usePreventDoubleTap } from './usePreventDoubleTap';

// Animation hooks
export { useAnimatedPress } from './useAnimatedPress';
export { useStaggeredList } from './useStaggeredList';
export { usePulseAnimation } from './usePulseAnimation';
export { useFloatingAnimation } from './useFloatingAnimation';

// Feature Access hook
export {
  useFeatureAccess,
  checkFeatureAccess,
  getFeatureLimitStandalone,
} from './useFeatureAccess';
export type { FeatureAccessResult, UseFeatureAccessReturn } from './useFeatureAccess';

// Subscription hook
export {
  useSubscription,
  useIsPremium,
  useSubscriptionTier,
  useSubscriptionLoading,
} from './useSubscription';
export type { UseSubscriptionReturn } from './useSubscription';
