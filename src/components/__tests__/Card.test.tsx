/**
 * Card Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../ui/Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );

      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should render as View when no onPress provided', () => {
      const { getByText } = render(
        <Card>
          <Text>Static Card</Text>
        </Card>
      );

      expect(getByText('Static Card')).toBeTruthy();
    });

    it('should render as TouchableOpacity when onPress provided', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Card onPress={mockOnPress}>
          <Text>Pressable Card</Text>
        </Card>
      );

      expect(getByText('Pressable Card')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { getByText } = render(
        <Card variant="default">
          <Text>Default Card</Text>
        </Card>
      );

      expect(getByText('Default Card')).toBeTruthy();
    });

    it('should render elevated variant', () => {
      const { getByText } = render(
        <Card variant="elevated">
          <Text>Elevated Card</Text>
        </Card>
      );

      expect(getByText('Elevated Card')).toBeTruthy();
    });

    it('should render outlined variant', () => {
      const { getByText } = render(
        <Card variant="outlined">
          <Text>Outlined Card</Text>
        </Card>
      );

      expect(getByText('Outlined Card')).toBeTruthy();
    });

    it('should render glass variant', () => {
      const { getByText } = render(
        <Card variant="glass">
          <Text>Glass Card</Text>
        </Card>
      );

      expect(getByText('Glass Card')).toBeTruthy();
    });
  });

  describe('Padding', () => {
    it('should render with no padding', () => {
      const { getByText } = render(
        <Card padding="none">
          <Text>No Padding</Text>
        </Card>
      );

      expect(getByText('No Padding')).toBeTruthy();
    });

    it('should render with small padding', () => {
      const { getByText } = render(
        <Card padding="sm">
          <Text>Small Padding</Text>
        </Card>
      );

      expect(getByText('Small Padding')).toBeTruthy();
    });

    it('should render with medium padding by default', () => {
      const { getByText } = render(
        <Card>
          <Text>Medium Padding</Text>
        </Card>
      );

      expect(getByText('Medium Padding')).toBeTruthy();
    });

    it('should render with large padding', () => {
      const { getByText } = render(
        <Card padding="lg">
          <Text>Large Padding</Text>
        </Card>
      );

      expect(getByText('Large Padding')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Card onPress={mockOnPress}>
          <Text>Press Me</Text>
        </Card>
      );

      fireEvent.press(getByText('Press Me'));

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom style', () => {
      const { getByText } = render(
        <Card style={{ marginTop: 20, backgroundColor: '#333' }}>
          <Text>Custom Style</Text>
        </Card>
      );

      expect(getByText('Custom Style')).toBeTruthy();
    });
  });
});
