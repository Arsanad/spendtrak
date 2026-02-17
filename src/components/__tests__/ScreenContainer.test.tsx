/**
 * ScreenContainer Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Polyfill clearImmediate for StatusBar in test environment
if (typeof global.clearImmediate === 'undefined') {
  (global as any).clearImmediate = (id: any) => clearTimeout(id);
}
if (typeof global.setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: any, ...args: any[]) => setTimeout(fn, 0, ...args);
}

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: ({ children, style, ...props }: any) => (
      <RN.View style={style} testID="safe-area-view" {...props}>{children}</RN.View>
    ),
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  };
});

// Mock design tokens
jest.mock('@/design/cinematic', () => ({
  Colors: {
    background: { primary: '#000000' },
  },
  Spacing: { lg: 16 },
}));

jest.mock('@/theme', () => ({
  zIndex: { base: 1 },
}));

import {
  ScreenContainer,
  ScrollableScreen,
  FullBleedScreen,
  ModalScreen,
  FoggyScreen,
} from '../layout/ScreenContainer';

describe('ScreenContainer', () => {
  it('should render children', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Screen Content</Text>
      </ScreenContainer>
    );

    expect(getByText('Screen Content')).toBeTruthy();
  });

  it('should render with safe area by default', () => {
    const { getByTestId } = render(
      <ScreenContainer>
        <Text>Content</Text>
      </ScreenContainer>
    );

    expect(getByTestId('safe-area-view')).toBeTruthy();
  });

  it('should render without safe area when safeArea=false', () => {
    const { queryByTestId } = render(
      <ScreenContainer safeArea={false}>
        <Text>Content</Text>
      </ScreenContainer>
    );

    expect(queryByTestId('safe-area-view')).toBeNull();
  });

  it('should render header when provided', () => {
    const { getByText } = render(
      <ScreenContainer header={<Text>Header</Text>}>
        <Text>Content</Text>
      </ScreenContainer>
    );

    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Content')).toBeTruthy();
  });

  it('should render footer when provided', () => {
    const { getByText } = render(
      <ScreenContainer footer={<Text>Footer</Text>}>
        <Text>Content</Text>
      </ScreenContainer>
    );

    expect(getByText('Footer')).toBeTruthy();
  });

  it('should render as scrollable when scrollable=true', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <ScreenContainer scrollable>
        <Text>Scrollable Content</Text>
      </ScreenContainer>
    );

    expect(getByText('Scrollable Content')).toBeTruthy();
    const ScrollView = require('react-native').ScrollView;
    const scrollViews = UNSAFE_queryAllByType(ScrollView);
    expect(scrollViews.length).toBeGreaterThan(0);
  });

  it('should apply custom background color', () => {
    const { getByTestId } = render(
      <ScreenContainer backgroundColor="#ff0000">
        <Text>Content</Text>
      </ScreenContainer>
    );

    const safeArea = getByTestId('safe-area-view');
    const styles = safeArea.props.style;
    const flatStyles = Array.isArray(styles)
      ? Object.assign({}, ...styles.filter(Boolean))
      : styles;
    expect(flatStyles.backgroundColor).toBe('#ff0000');
  });

  it('should render fog container when fog=true', () => {
    const tree = render(
      <ScreenContainer fog>
        <Text>Foggy Content</Text>
      </ScreenContainer>
    );

    expect(tree.getByText('Foggy Content')).toBeTruthy();
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('ScrollableScreen', () => {
  it('should render as scrollable', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <ScrollableScreen>
        <Text>Scrollable</Text>
      </ScrollableScreen>
    );

    expect(getByText('Scrollable')).toBeTruthy();
    const ScrollView = require('react-native').ScrollView;
    const scrollViews = UNSAFE_queryAllByType(ScrollView);
    expect(scrollViews.length).toBeGreaterThan(0);
  });
});

describe('FullBleedScreen', () => {
  it('should render children', () => {
    const { getByText } = render(
      <FullBleedScreen>
        <Text>Full Bleed</Text>
      </FullBleedScreen>
    );

    expect(getByText('Full Bleed')).toBeTruthy();
  });
});

describe('ModalScreen', () => {
  it('should render children', () => {
    const { getByText } = render(
      <ModalScreen>
        <Text>Modal Content</Text>
      </ModalScreen>
    );

    expect(getByText('Modal Content')).toBeTruthy();
  });
});

describe('FoggyScreen', () => {
  it('should render children', () => {
    const { getByText } = render(
      <FoggyScreen>
        <Text>Foggy Content</Text>
      </FoggyScreen>
    );

    expect(getByText('Foggy Content')).toBeTruthy();
  });
});
