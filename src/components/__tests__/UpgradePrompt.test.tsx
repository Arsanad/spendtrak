/**
 * UpgradePrompt Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies - use mockImplementation inside factory for restoreMocks resilience
jest.mock('@/hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({
    currentTier: 'free',
    getFeatureInfo: jest.fn().mockImplementation((feature: string) => ({
      displayName: 'AI Consultant',
      description: 'Get AI-powered financial advice',
      icon: 'sparkles',
    })),
  }),
}));

jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'premium.recommended': 'RECOMMENDED',
        'premium.upgradeToPremium': 'Upgrade to Premium',
        'premium.currentPlan': 'Current Plan',
        'premium.maybeLater': 'Maybe Later',
        'premium.cancelAnytime': 'Cancel Anytime',
        'premium.savePercent': `Save ${params?.percent}%`,
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/config/features', () => ({
  TIER_CONFIGS: {
    free: {
      displayName: 'Free',
      description: 'Basic features',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: {},
    },
    premium: {
      displayName: 'Premium',
      description: 'All features unlocked',
      monthlyPrice: 9.99,
      yearlyPrice: 79.99,
      badge: 'PREMIUM',
      features: {
        ai_consultant: { enabled: true, limit: -1 },
        advanced_analytics: { enabled: true, limit: -1 },
        receipt_scanning: { enabled: true, limit: -1 },
      },
    },
  },
  FEATURE_METADATA: {
    ai_consultant: { displayName: 'AI Consultant', icon: 'sparkles' },
    advanced_analytics: { displayName: 'Advanced Analytics', icon: 'analytics' },
    receipt_scanning: { displayName: 'Receipt Scanning', icon: 'scan' },
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/utils/haptics', () => ({
  lightTap: jest.fn(),
  heavyTap: jest.fn(),
  deleteBuzz: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <View {...props} />,
    },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    SlideInDown: { springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }) },
    SlideOutDown: { duration: () => ({}) },
    useAnimatedStyle: (fn: () => any) => ({}),
    useSharedValue: (val: any) => ({ value: val }),
    withRepeat: jest.fn(),
    withTiming: jest.fn(),
    withSequence: jest.fn(),
    Easing: { inOut: () => ({}), sin: {} },
  };
});

jest.mock('@/design/cinematic', () => ({
  Colors: {
    neon: '#00ff88',
    primary: '#00cc6a',
  },
  Spacing: { lg: 16 },
  BorderRadius: { lg: 12 },
}));

import { UpgradePrompt } from '../premium/UpgradePrompt';

describe('UpgradePrompt', () => {
  const mockOnDismiss = jest.fn();
  const mockOnUpgrade = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <UpgradePrompt
        visible={false}
        onDismiss={mockOnDismiss}
      />
    );

    expect(queryByText('Upgrade Your Plan')).toBeNull();
  });

  it('should render when visible', () => {
    const { getByText } = render(
      <UpgradePrompt
        visible={true}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Upgrade Your Plan')).toBeTruthy();
  });

  it('should show feature-specific title when feature is provided', () => {
    const { getByText } = render(
      <UpgradePrompt
        visible={true}
        feature={'ai_consultant' as any}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Unlock AI Consultant/)).toBeTruthy();
  });

  it('should render pricing information', () => {
    const { getAllByText } = render(
      <UpgradePrompt
        visible={true}
        onDismiss={mockOnDismiss}
      />
    );

    // Price is split across nested Text nodes and appears in both monthly/yearly
    // Use getAllByText with regex to verify pricing is rendered
    expect(getAllByText(/9\.99/).length).toBeGreaterThan(0);
  });

  it('should render Maybe Later button', () => {
    const { getByText } = render(
      <UpgradePrompt
        visible={true}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Maybe Later')).toBeTruthy();
  });

  it('should call onDismiss when Maybe Later is pressed', () => {
    const { getByText } = render(
      <UpgradePrompt
        visible={true}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByText('Maybe Later'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should render Cancel Anytime text', () => {
    const { getByText } = render(
      <UpgradePrompt
        visible={true}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Cancel Anytime')).toBeTruthy();
  });

  it('should render the upgrade button', () => {
    const { getByText } = render(
      <UpgradePrompt
        visible={true}
        onDismiss={mockOnDismiss}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(getByText('Upgrade to Premium')).toBeTruthy();
  });
});
