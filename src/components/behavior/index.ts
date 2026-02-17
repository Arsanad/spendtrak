/**
 * Behavioral Intelligence Components
 * Components for behavior detection UI, interventions, and win celebrations
 */

export { BehavioralMicroCard } from './BehavioralMicroCard';
export type { BehavioralMicroCardProps } from './BehavioralMicroCard';

export { InlineAIMessage } from './InlineAIMessage';
export type { InlineAIMessageProps, MessageVariant } from './InlineAIMessage';

export { WinCelebration } from './WinCelebration';
export type { WinCelebrationProps } from './WinCelebration';

export { QuantumAcknowledgment } from './QuantumAcknowledgment';
export type { QuantumAcknowledgmentProps } from './QuantumAcknowledgment';

// Re-export onboarding components for convenience
export { IntroVideo } from '../onboarding/IntroVideo';
export type { IntroVideoProps } from '../onboarding/IntroVideo';

export { BehavioralOnboarding, checkBehavioralOnboardingComplete, resetBehavioralOnboarding } from '../onboarding/BehavioralOnboarding';
export type { BehavioralOnboardingProps } from '../onboarding/BehavioralOnboarding';

export { ReEngagementModal } from '../onboarding/ReEngagementModal';
export type { ReEngagementModalProps } from '../onboarding/ReEngagementModal';
