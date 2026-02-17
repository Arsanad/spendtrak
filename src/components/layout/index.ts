/**
 * SpendTrak Layout Components
 * Structural components for consistent screen layouts
 *
 * Usage:
 * import { ScreenContainer, Header, BackHeader } from '@/components/layout';
 */

// ===== SCREEN CONTAINER =====
export {
  ScreenContainer,
  ScrollableScreen,
  FullBleedScreen,
  ModalScreen,
  FoggyScreen,
} from './ScreenContainer';
export type { ScreenContainerProps } from './ScreenContainer';

// ===== HEADER =====
export {
  Header,
  BackHeader,
  WelcomeHeader,
} from './Header';
export type { HeaderProps, HeaderAction, HeaderVariant } from './Header';
