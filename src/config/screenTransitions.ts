// SPENDTRAK CINEMATIC EDITION - Screen Transitions
// All navigation uses BLACKOUT ONLY - no native animations
// The TransitionContext handles the fade-through-black effect

// Stack screen options - NO animation (blackout handles it)
export const slideFromRightOptions = {
  animation: 'none' as const,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
};

// Stack screen options - NO animation (blackout handles it)
export const fadeOptions = {
  animation: 'none' as const,
  gestureEnabled: false,
};

// Modal screen options - NO animation (blackout handles it)
export const modalOptions = {
  animation: 'none' as const,
  presentation: 'modal' as const,
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
};

// Transparent modal screen options - NO animation
export const transparentModalOptions = {
  animation: 'none' as const,
  presentation: 'transparentModal' as const,
  gestureEnabled: true,
};

// No animation (for initial/root screens)
export const noAnimationOptions = {
  animation: 'none' as const,
};

// Card transition spec - instant (blackout handles visual transition)
export const cardTransitionSpec = {
  open: {
    animation: 'timing' as const,
    config: {
      duration: 0,
    },
  },
  close: {
    animation: 'timing' as const,
    config: {
      duration: 0,
    },
  },
};

// Default stack screen options - NO animation (blackout handles it)
export const defaultStackOptions = {
  headerShown: false,
  animation: 'none' as const,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  freezeOnBlur: true,
};

// Default tab screen options - NO animation (blackout handles it)
export const defaultTabOptions = {
  headerShown: false,
  lazy: true,
  unmountOnBlur: false,
  freezeOnBlur: true,
  animation: 'none' as const,
};
