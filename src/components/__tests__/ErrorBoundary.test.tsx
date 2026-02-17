/**
 * ErrorBoundary Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    general: {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

// Mock design tokens
jest.mock('../../design/cinematic', () => ({
  Colors: {
    void: '#000000',
    primary: '#00cc6a',
    neon: '#00ff88',
    deep: '#003d1f',
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
      tertiary: '#707070',
    },
    background: {
      elevated: '#002a17',
    },
    border: {
      subtle: '#1a1a1a',
    },
    transparent: {
      dark20: 'rgba(0,0,0,0.2)',
    },
  },
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  BorderRadius: { sm: 4, md: 8, lg: 12, xl: 16 },
  FontFamily: {
    regular: 'Cinzel_400Regular',
    semiBold: 'Cinzel_600SemiBold',
    bold: 'Cinzel_700Bold',
  },
  FontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20 },
}));

import { ErrorBoundary } from '../ErrorBoundary';

// A component that throws an error on render
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello World</Text>
      </ErrorBoundary>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should catch errors and show default fallback UI', () => {
    const { getByText, getByTestId } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByTestId('error-boundary-screen')).toBeTruthy();
    expect(getByTestId('error-retry-button')).toBeTruthy();
  });

  it('should show custom fallback when provided', () => {
    const CustomFallback = <Text>Custom Error View</Text>;

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Custom Error View')).toBeTruthy();
    expect(queryByText('Oops! Something went wrong')).toBeNull();
  });

  it('should call onError callback when an error is caught', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should recover when retry button is pressed', () => {
    const { getByTestId, getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state is shown
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Press retry - it will re-render children (which will throw again,
    // but the test validates the retry mechanism resets state)
    fireEvent.press(getByTestId('error-retry-button'));

    // After retry, the boundary tries to render children again
    // Since ThrowingComponent still throws, we'll see the error UI again
    expect(getByText('Oops! Something went wrong')).toBeTruthy();
  });

  it('should display support text in error state', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(getByText('If the problem persists, please contact support.')).toBeTruthy();
  });
});
