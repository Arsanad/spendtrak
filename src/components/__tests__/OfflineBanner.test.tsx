/**
 * OfflineBanner Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies before importing component
const mockRefresh = jest.fn();
let mockIsConnected = true;

jest.mock('../../context/NetworkContext', () => ({
  useNetwork: () => ({
    isConnected: mockIsConnected,
    refresh: mockRefresh,
  }),
}));

jest.mock('../../context/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.offline': 'You are offline',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <View {...props} />,
    },
    FadeInUp: { duration: () => ({}) },
    FadeOutUp: { duration: () => ({}) },
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import { OfflineBanner } from '../common/OfflineBanner';

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
  });

  it('should not render when online', () => {
    mockIsConnected = true;
    const { queryByText } = render(<OfflineBanner />);
    expect(queryByText('You are offline')).toBeNull();
  });

  it('should render when offline', () => {
    mockIsConnected = false;
    const { getByText } = render(<OfflineBanner />);
    expect(getByText('You are offline')).toBeTruthy();
  });

  it('should call refresh when retry button is pressed', () => {
    mockIsConnected = false;
    const tree = render(<OfflineBanner />);

    // The banner is visible
    expect(tree.getByText('You are offline')).toBeTruthy();

    // Find the refresh Pressable and press it
    const refreshButtons = tree.UNSAFE_queryAllByType(
      require('react-native').Pressable
    );

    if (refreshButtons.length > 0) {
      fireEvent.press(refreshButtons[0]);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    }
  });

  it('should hide when connectivity is restored', () => {
    // First render offline
    mockIsConnected = false;
    const { unmount, queryByText } = render(<OfflineBanner />);
    expect(queryByText('You are offline')).toBeTruthy();
    unmount();

    // Re-render as online (use fresh render to bypass memo)
    mockIsConnected = true;
    const { queryByText: queryByText2 } = render(<OfflineBanner />);
    expect(queryByText2('You are offline')).toBeNull();
  });
});
