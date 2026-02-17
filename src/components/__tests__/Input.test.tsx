/**
 * Input Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../ui/Input';
import { Text } from 'react-native';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render basic input', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" />
      );

      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with label', () => {
      const { getByText } = render(
        <Input label="Email" placeholder="Enter email" />
      );

      expect(getByText('Email')).toBeTruthy();
    });

    it('should render with error message', () => {
      const { getByText } = render(
        <Input error="This field is required" placeholder="Enter text" />
      );

      expect(getByText('This field is required')).toBeTruthy();
    });

    it('should render with helper text', () => {
      const { getByText } = render(
        <Input hint="Enter your email address" placeholder="Email" />
      );

      expect(getByText('Enter your email address')).toBeTruthy();
    });

    it('should not show helper text when error is present', () => {
      const { getByText, queryByText } = render(
        <Input
          error="Error message"
          hint="Helper text"
          placeholder="Email"
        />
      );

      expect(getByText('Error message')).toBeTruthy();
      expect(queryByText('Helper text')).toBeFalsy();
    });

    it('should render with left icon', () => {
      const { getByText } = render(
        <Input placeholder="Search" leftIcon={<Text>🔍</Text>} />
      );

      expect(getByText('🔍')).toBeTruthy();
    });

    it('should render with right icon', () => {
      const { getByText } = render(
        <Input placeholder="Amount" rightIcon={<Text>$</Text>} />
      );

      expect(getByText('$')).toBeTruthy();
    });
  });

  describe('Text Input', () => {
    it('should handle text input', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onChangeText={onChangeText} />
      );

      fireEvent.changeText(getByPlaceholderText('Enter text'), 'Hello World');

      expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('should display initial value', () => {
      const { getByDisplayValue } = render(
        <Input placeholder="Enter text" value="Initial Value" />
      );

      expect(getByDisplayValue('Initial Value')).toBeTruthy();
    });
  });

  describe('Focus State', () => {
    it('should handle focus event', () => {
      const onFocus = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onFocus={onFocus} />
      );

      fireEvent(getByPlaceholderText('Enter text'), 'focus');

      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const onBlur = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onBlur={onBlur} />
      );

      fireEvent(getByPlaceholderText('Enter text'), 'blur');

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Secure Entry', () => {
    it('should render secure text entry input', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Password"
          secureTextEntry={true}
        />
      );

      expect(getByPlaceholderText('Password')).toBeTruthy();
    });
  });

  describe('Multiline', () => {
    it('should render multiline input', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter description" multiline={true} />
      );

      expect(getByPlaceholderText('Enter description')).toBeTruthy();
    });
  });
});
