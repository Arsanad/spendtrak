/**
 * HapticPressable Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

// Mock haptics utilities - define mocks inside factory to survive restoreMocks
jest.mock('../../utils/haptics', () => ({
  lightTap: jest.fn(),
  mediumTap: jest.fn(),
  heavyTap: jest.fn(),
  selectionTap: jest.fn(),
  triggerHaptic: jest.fn(),
}));

// Get references to mock functions via require (survives resetMocks/restoreMocks)
const getHapticsMock = () => require('../../utils/haptics') as {
  lightTap: jest.Mock;
  mediumTap: jest.Mock;
  heavyTap: jest.Mock;
  selectionTap: jest.Mock;
};

import {
  HapticPressable,
  HapticTouchableOpacity,
  LightTapPressable,
  MediumTapPressable,
  SelectionPressable,
} from '../ui/HapticPressable';

describe('HapticPressable', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress}>
        <Text>Press Me</Text>
      </HapticPressable>
    );

    expect(getByText('Press Me')).toBeTruthy();
  });

  it('should trigger light haptic feedback on press-in by default', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress}>
        <Text>Press Me</Text>
      </HapticPressable>
    );

    fireEvent(getByText('Press Me'), 'pressIn');
    expect(getHapticsMock().lightTap).toHaveBeenCalledTimes(1);
  });

  it('should trigger medium haptic when hapticIntensity is medium', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} hapticIntensity="medium">
        <Text>Medium</Text>
      </HapticPressable>
    );

    fireEvent(getByText('Medium'), 'pressIn');
    expect(getHapticsMock().mediumTap).toHaveBeenCalledTimes(1);
  });

  it('should trigger heavy haptic when hapticIntensity is heavy', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} hapticIntensity="heavy">
        <Text>Heavy</Text>
      </HapticPressable>
    );

    fireEvent(getByText('Heavy'), 'pressIn');
    expect(getHapticsMock().heavyTap).toHaveBeenCalledTimes(1);
  });

  it('should trigger selection haptic when hapticIntensity is selection', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} hapticIntensity="selection">
        <Text>Selection</Text>
      </HapticPressable>
    );

    fireEvent(getByText('Selection'), 'pressIn');
    expect(getHapticsMock().selectionTap).toHaveBeenCalledTimes(1);
  });

  it('should not trigger haptic when hapticIntensity is none', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} hapticIntensity="none">
        <Text>No Haptic</Text>
      </HapticPressable>
    );

    fireEvent(getByText('No Haptic'), 'pressIn');
    const haptics = getHapticsMock();
    expect(haptics.lightTap).not.toHaveBeenCalled();
    expect(haptics.mediumTap).not.toHaveBeenCalled();
    expect(haptics.heavyTap).not.toHaveBeenCalled();
    expect(haptics.selectionTap).not.toHaveBeenCalled();
  });

  it('should not trigger haptic when disabled', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} disabled>
        <Text>Disabled</Text>
      </HapticPressable>
    );

    fireEvent(getByText('Disabled'), 'pressIn');
    expect(getHapticsMock().lightTap).not.toHaveBeenCalled();
  });

  it('should trigger haptic on pressOut when hapticTrigger is pressOut', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} hapticTrigger="pressOut">
        <Text>Press Out</Text>
      </HapticPressable>
    );

    // pressIn should not trigger haptic
    fireEvent(getByText('Press Out'), 'pressIn');
    expect(getHapticsMock().lightTap).not.toHaveBeenCalled();

    // pressOut should trigger haptic
    fireEvent(getByText('Press Out'), 'pressOut');
    expect(getHapticsMock().lightTap).toHaveBeenCalledTimes(1);
  });

  it('should call original onPressIn handler', () => {
    const mockPressIn = jest.fn();

    const { getByText } = render(
      <HapticPressable onPress={mockOnPress} onPressIn={mockPressIn}>
        <Text>Press</Text>
      </HapticPressable>
    );

    fireEvent(getByText('Press'), 'pressIn');
    expect(mockPressIn).toHaveBeenCalledTimes(1);
    expect(getHapticsMock().lightTap).toHaveBeenCalledTimes(1);
  });

  it('should call onPress when pressed', () => {
    const { getByText } = render(
      <HapticPressable onPress={mockOnPress}>
        <Text>Press Me</Text>
      </HapticPressable>
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});

describe('HapticTouchableOpacity', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    const { getByText } = render(
      <HapticTouchableOpacity onPress={mockOnPress}>
        <Text>Touchable</Text>
      </HapticTouchableOpacity>
    );

    expect(getByText('Touchable')).toBeTruthy();
  });

  it('should trigger light haptic on press by default', () => {
    const { getByText } = render(
      <HapticTouchableOpacity onPress={mockOnPress}>
        <Text>Touchable</Text>
      </HapticTouchableOpacity>
    );

    fireEvent.press(getByText('Touchable'));
    expect(getHapticsMock().lightTap).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should not trigger haptic when disabled', () => {
    const { getByText } = render(
      <HapticTouchableOpacity onPress={mockOnPress} disabled>
        <Text>Disabled</Text>
      </HapticTouchableOpacity>
    );

    fireEvent.press(getByText('Disabled'));
    expect(getHapticsMock().lightTap).not.toHaveBeenCalled();
  });
});

describe('Preset Variants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('LightTapPressable should use light haptic', () => {
    const { getByText } = render(
      <LightTapPressable onPress={jest.fn()}>
        <Text>Light</Text>
      </LightTapPressable>
    );

    fireEvent(getByText('Light'), 'pressIn');
    expect(getHapticsMock().lightTap).toHaveBeenCalledTimes(1);
  });

  it('MediumTapPressable should use medium haptic', () => {
    const { getByText } = render(
      <MediumTapPressable onPress={jest.fn()}>
        <Text>Medium</Text>
      </MediumTapPressable>
    );

    fireEvent(getByText('Medium'), 'pressIn');
    expect(getHapticsMock().mediumTap).toHaveBeenCalledTimes(1);
  });

  it('SelectionPressable should use selection haptic', () => {
    const { getByText } = render(
      <SelectionPressable onPress={jest.fn()}>
        <Text>Selection</Text>
      </SelectionPressable>
    );

    fireEvent(getByText('Selection'), 'pressIn');
    expect(getHapticsMock().selectionTap).toHaveBeenCalledTimes(1);
  });
});
