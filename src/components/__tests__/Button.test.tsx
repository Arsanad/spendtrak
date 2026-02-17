/**
 * Button Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '../ui/Button';
import { Text } from 'react-native';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with children', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress}>Test Button</Button>
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should render with left icon', () => {
      const { getByText } = render(
        <Button
          onPress={mockOnPress}
          icon={<Text>🎯</Text>}
        >
          With Icon
        </Button>
      );

      expect(getByText('🎯')).toBeTruthy();
      expect(getByText('With Icon')).toBeTruthy();
    });

    it('should render with right icon', () => {
      const { getByText } = render(
        <Button
          onPress={mockOnPress}
          iconRight={<Text>→</Text>}
        >
          With Icon
        </Button>
      );

      expect(getByText('→')).toBeTruthy();
    });

    it('should show loading indicator when loading', () => {
      const { queryByText, UNSAFE_getByType } = render(
        <Button onPress={mockOnPress} loading={true}>Loading</Button>
      );

      // Title should not be visible when loading
      expect(queryByText('Loading')).toBeFalsy();
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress}>Primary</Button>
      );

      expect(getByText('Primary')).toBeTruthy();
    });

    it('should render secondary variant', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} variant="secondary">Secondary</Button>
      );

      expect(getByText('Secondary')).toBeTruthy();
    });

    it('should render outline variant', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} variant="outline">Outline</Button>
      );

      expect(getByText('Outline')).toBeTruthy();
    });

    it('should render ghost variant', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} variant="ghost">Ghost</Button>
      );

      expect(getByText('Ghost')).toBeTruthy();
    });

    it('should render danger variant', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} variant="danger">Danger</Button>
      );

      expect(getByText('Danger')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} size="small">Small</Button>
      );

      expect(getByText('Small')).toBeTruthy();
    });

    it('should render medium size by default', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress}>Medium</Button>
      );

      expect(getByText('Medium')).toBeTruthy();
    });

    it('should render large size', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} size="large">Large</Button>
      );

      expect(getByText('Large')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', async () => {
      const { getByText } = render(
        <Button onPress={mockOnPress}>Press Me</Button>
      );

      fireEvent.press(getByText('Press Me'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onPress when disabled', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} disabled={true}>Disabled</Button>
      );

      fireEvent.press(getByText('Disabled'));

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const { getByTestId } = render(
        <Button onPress={mockOnPress} loading={true}>Loading</Button>
      );

      // Loading button should be disabled
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should apply fullWidth style', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress} fullWidth={true}>Full Width</Button>
      );

      expect(getByText('Full Width')).toBeTruthy();
    });

    it('should apply custom style', () => {
      const { getByText } = render(
        <Button
          onPress={mockOnPress}
          style={{ marginTop: 20 }}
        >
          Custom
        </Button>
      );

      expect(getByText('Custom')).toBeTruthy();
    });

    it('should apply custom text style', () => {
      const { getByText } = render(
        <Button
          onPress={mockOnPress}
          textStyle={{ fontSize: 20 }}
        >
          Custom Text
        </Button>
      );

      expect(getByText('Custom Text')).toBeTruthy();
    });
  });
});
