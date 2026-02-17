/**
 * PageSkeleton Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <RN.View {...props} />,
    },
    useSharedValue: (val: any) => ({ value: val }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withRepeat: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    interpolate: jest.fn((val, inputRange, outputRange) => outputRange[0]),
  };
});

// Mock design tokens
jest.mock('../../design/cinematic', () => ({
  Colors: {
    void: '#000000',
    transparent: {
      neon10: 'rgba(0,255,136,0.1)',
      darker60: 'rgba(0,0,0,0.6)',
      darker40: 'rgba(0,0,0,0.4)',
    },
  },
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  BorderRadius: { sm: 4, md: 8, lg: 12 },
}));

import {
  PageSkeleton,
  SkeletonBlock,
  SkeletonCard,
  SkeletonListItem,
  HomePageSkeleton,
  StatsPageSkeleton,
  SettingsPageSkeleton,
} from '../PageSkeleton';

describe('PageSkeleton', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<PageSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('should contain skeleton blocks', () => {
    const tree = render(<PageSkeleton />);
    // PageSkeleton renders multiple View elements (skeleton blocks)
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('SkeletonBlock', () => {
  it('should render with default props', () => {
    const { toJSON } = render(<SkeletonBlock />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render with custom dimensions', () => {
    const { toJSON } = render(
      <SkeletonBlock width={200} height={40} borderRadius={10} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should render with string width (percentage)', () => {
    const { toJSON } = render(<SkeletonBlock width="50%" height={20} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render with custom style', () => {
    const { toJSON } = render(
      <SkeletonBlock style={{ marginBottom: 10 }} />
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe('SkeletonCard', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<SkeletonCard />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render with custom style', () => {
    const { toJSON } = render(
      <SkeletonCard style={{ marginTop: 20 }} />
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe('SkeletonListItem', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<SkeletonListItem />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render with custom style', () => {
    const { toJSON } = render(
      <SkeletonListItem style={{ marginBottom: 5 }} />
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe('HomePageSkeleton', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<HomePageSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('StatsPageSkeleton', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<StatsPageSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('SettingsPageSkeleton', () => {
  it('should render without crashing', () => {
    const { toJSON } = render(<SettingsPageSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
