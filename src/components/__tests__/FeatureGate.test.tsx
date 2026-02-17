/**
 * FeatureGate Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock dependencies
let mockAccessResult: {
  canAccess: boolean;
  isEnabled: boolean;
  needsUpgrade: boolean;
  requiredTier: 'free' | 'premium';
  isAtLimit: boolean;
  limit: number | null;
} = {
  canAccess: true,
  isEnabled: true,
  needsUpgrade: false,
  requiredTier: 'free',
  isAtLimit: false,
  limit: null,
};

const mockShowUpgradePrompt = jest.fn();

jest.mock('@/hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({
    getFeatureAccess: jest.fn().mockImplementation(() => mockAccessResult),
    showUpgradePrompt: mockShowUpgradePrompt,
    getTierInfo: jest.fn().mockImplementation(() => ({
      displayName: 'Premium',
      monthlyPrice: 9.99,
    })),
    getFeatureInfo: jest.fn().mockImplementation(() => ({
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
        'premium.requiresSubscription': `Requires ${params?.tier} subscription`,
        'premium.upgradeNow': 'Upgrade Now',
        'premium.startingAt': `Starting at ${params?.price}`,
        'premium.unlockFeature': `Unlock ${params?.feature}`,
        'premium.upgradeToAccess': 'Upgrade to Access',
        'premium.tapToUpgrade': 'Tap to upgrade',
        'premium.limitReached': `${params?.feature} limit reached (${params?.limit})`,
        'premium.upgradeForMore': 'Upgrade for more',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/config/features', () => ({
  FEATURE_METADATA: {
    ai_consultant: {
      displayName: 'AI Consultant',
      description: 'Get AI-powered financial advice',
      icon: 'sparkles',
    },
  },
  TIER_CONFIGS: {
    free: { displayName: 'Free', badge: 'FREE', monthlyPrice: 0 },
    premium: { displayName: 'Premium', badge: 'PREMIUM', monthlyPrice: 9.99 },
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

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <View {...props} />,
    },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    useAnimatedStyle: (fn: () => any) => ({}),
    useSharedValue: (val: any) => ({ value: val }),
    withRepeat: jest.fn(),
    withTiming: jest.fn(),
    Easing: { inOut: () => ({}), sin: {} },
  };
});

jest.mock('@/design/cinematic', () => ({
  Colors: {
    neon: '#00ff88',
    primary: '#00cc6a',
  },
}));

import { FeatureGate } from '../premium/FeatureGate';

describe('FeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to full access by default
    mockAccessResult = {
      canAccess: true,
      isEnabled: true,
      needsUpgrade: false,
      requiredTier: 'free',
      isAtLimit: false,
      limit: null,
    };
  });

  it('should show children when user has access', () => {
    const { getByText } = render(
      <FeatureGate feature={'ai_consultant' as any}>
        <Text>Premium Content</Text>
      </FeatureGate>
    );

    expect(getByText('Premium Content')).toBeTruthy();
  });

  it('should show upgrade prompt when user needs upgrade (block variant)', () => {
    mockAccessResult = {
      canAccess: false,
      isEnabled: false,
      needsUpgrade: true,
      requiredTier: 'premium',
      isAtLimit: false,
      limit: null,
    };

    const { getByText } = render(
      <FeatureGate feature={'ai_consultant' as any} variant="block">
        <Text>Premium Content</Text>
      </FeatureGate>
    );

    expect(getByText('AI Consultant')).toBeTruthy();
    expect(getByText('Upgrade Now')).toBeTruthy();
  });

  it('should show custom fallback when access denied and fallback provided', () => {
    mockAccessResult = {
      canAccess: false,
      isEnabled: false,
      needsUpgrade: true,
      requiredTier: 'premium',
      isAtLimit: false,
      limit: null,
    };

    const { getByText, queryByText } = render(
      <FeatureGate
        feature={'ai_consultant' as any}
        fallback={<Text>Upgrade Required</Text>}
      >
        <Text>Premium Content</Text>
      </FeatureGate>
    );

    expect(getByText('Upgrade Required')).toBeTruthy();
    expect(queryByText('Premium Content')).toBeNull();
  });

  it('should call onUpgradePress when upgrade button is pressed', () => {
    mockAccessResult = {
      canAccess: false,
      isEnabled: false,
      needsUpgrade: true,
      requiredTier: 'premium',
      isAtLimit: false,
      limit: null,
    };

    const mockOnUpgrade = jest.fn();

    const { getByText } = render(
      <FeatureGate
        feature={'ai_consultant' as any}
        variant="block"
        onUpgradePress={mockOnUpgrade}
      >
        <Text>Premium Content</Text>
      </FeatureGate>
    );

    fireEvent.press(getByText('Upgrade Now'));
    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
  });

  it('should show inline variant when specified', () => {
    mockAccessResult = {
      canAccess: false,
      isEnabled: false,
      needsUpgrade: true,
      requiredTier: 'premium',
      isAtLimit: false,
      limit: null,
    };

    const { getByText } = render(
      <FeatureGate feature={'ai_consultant' as any} variant="inline">
        <Text>Premium Content</Text>
      </FeatureGate>
    );

    expect(getByText('Tap to upgrade')).toBeTruthy();
  });

  it('should respect checkUsage flag', () => {
    mockAccessResult = {
      canAccess: false,
      isEnabled: true,
      needsUpgrade: false,
      requiredTier: 'premium',
      isAtLimit: true,
      limit: 5,
    };

    const { queryByText } = render(
      <FeatureGate feature={'ai_consultant' as any} checkUsage={true}>
        <Text>Premium Content</Text>
      </FeatureGate>
    );

    // canAccess is false, so content should be hidden
    expect(queryByText('Premium Content')).toBeNull();
  });
});
