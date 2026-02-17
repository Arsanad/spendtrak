/**
 * ErrorFallback Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock design tokens
jest.mock('../../design/cinematic', () => ({
  Colors: {
    void: '#000000',
    primary: '#00cc6a',
    semantic: { error: '#ff3366' },
    text: { secondary: '#a0a0a0' },
  },
  Spacing: { sm: 8, md: 12, xl: 24 },
  FontFamily: {
    regular: 'Cinzel_400Regular',
    semiBold: 'Cinzel_600SemiBold',
    bold: 'Cinzel_700Bold',
  },
  FontSize: { sm: 12, md: 14, xl: 20 },
  BorderRadius: { md: 8 },
}));

import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const mockResetError = jest.fn();

  const defaultProps = {
    error: new Error('Something broke'),
    componentStack: '<App>\n  <Screen>\n    <Component>',
    eventId: 'test-event-123',
    resetError: mockResetError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the error title', () => {
    const { getByText } = render(<ErrorFallback {...defaultProps} />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should render the error message from an Error object', () => {
    const { getByText } = render(<ErrorFallback {...defaultProps} />);
    expect(getByText('Something broke')).toBeTruthy();
  });

  it('should render a string error message', () => {
    const { getByText } = render(
      <ErrorFallback {...defaultProps} error="A string error occurred" />
    );
    expect(getByText('A string error occurred')).toBeTruthy();
  });

  it('should render the Try Again button', () => {
    const { getByText } = render(<ErrorFallback {...defaultProps} />);
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should call resetError when Try Again is pressed', () => {
    const { getByText } = render(<ErrorFallback {...defaultProps} />);

    fireEvent.press(getByText('Try Again'));
    expect(mockResetError).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error and non-string error types', () => {
    const { getByText } = render(
      <ErrorFallback {...defaultProps} error={{ code: 500 }} />
    );
    // String() on an object gives '[object Object]'
    expect(getByText('[object Object]')).toBeTruthy();
  });
});
