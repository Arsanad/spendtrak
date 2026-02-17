/**
 * SpendTrak UI Components Index
 * Central export for all base UI components
 *
 * Usage:
 * import { Text, Button, Card, Spacer, Divider } from '@/components/ui';
 */

// ===== TEXT =====
// Plain text component with variants (use GradientText for gradient effects)
export {
  Text,
  Title,
  Heading,
  Subheading,
  Body,
  Caption,
  Label,
  ErrorText,
  SuccessText,
  AmountText,
} from './Text';
export type { TextProps, TextVariant, TextColor, TextWeight, TextAlign } from './Text';

// Gradient Text (for special effects)
export {
  GradientText,
  GradientBalance,
  GradientIncome,
  GradientExpense,
  GradientStatistic,
  GradientTitle,
  GradientHeading,
  GradientLabel,
  GradientBody,
  GradientCardTitle,
  GradientNavLabel,
} from './GradientText';
export type { GradientTextProps, GradientVariant } from './GradientText';

// ===== CARD =====
// Simple Card wrapper
export {
  Card,
  ElevatedCard,
  OutlinedCard,
  GlassCardSimple,
  CompactCard,
} from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

// GlassCard (advanced card with more options)
export {
  GlassCard,
  QuickActionCard,
  StatsCard,
  ListItemCard,
} from './GlassCard';
export type {
  GlassCardProps,
  CardVariant as GlassCardVariant,
  CardSize as GlassCardSize,
} from './GlassCard';

// ===== BUTTON =====
export {
  Button,
  IconButton,
  FAB,
} from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// ===== INPUT =====
export {
  Input,
  AmountInput,
  SearchInput,
  TextArea,
} from './Input';
export type { InputProps } from './Input';

// ===== SPACER =====
export {
  Spacer,
  SpacerXS,
  SpacerSM,
  SpacerMD,
  SpacerLG,
  SpacerXL,
  SpacerXXL,
  FlexSpacer,
} from './Spacer';
export type { SpacerProps, SpacerSize } from './Spacer';

// ===== DIVIDER =====
export {
  Divider,
  DividerSubtle,
  DividerSection,
  DividerGlow,
  ListDivider,
} from './Divider';
export type { DividerProps, DividerVariant, DividerSpacing } from './Divider';

// ===== BADGE, TOGGLE, CHIP =====
export {
  Badge,
  Toggle,
  Chip,
  NotificationDot,
} from './Badge';
export type {
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  ToggleProps,
  ChipProps,
  NotificationDotProps,
} from './Badge';

// ===== MODAL =====
export { ConfirmationModal } from './ConfirmationModal';
export type { ConfirmationModalProps, ConfirmationVariant } from './ConfirmationModal';

// ===== ANIMATION COMPONENTS =====
export { AnimatedScreen } from './AnimatedScreen';
export { OptimizedList } from './OptimizedList';
export { PremiumPressable } from './PremiumPressable';
export { PremiumCard } from './PremiumCard';
export { SmoothScrollView } from './SmoothScrollView';

// ===== HAPTIC PRESSABLE =====
// Drop-in replacements for Pressable/TouchableOpacity with automatic haptic feedback
export {
  HapticPressable,
  HapticTouchableOpacity,
  LightTapPressable,
  MediumTapPressable,
  SelectionPressable,
} from './HapticPressable';
export type { HapticPressableProps, HapticTouchableProps, HapticStyle } from './HapticPressable';
