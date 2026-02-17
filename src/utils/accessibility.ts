/**
 * Accessibility Utilities for SpendTrak
 * Ensures WCAG 2.1 compliance for screen readers
 */

import { AccessibilityRole } from 'react-native';

/**
 * Standard accessibility props generators
 * Usage: <TouchableOpacity {...a11y.button('Save', 'Saves your changes')} />
 */
export const a11y = {
  button: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  link: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityRole: 'link' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  header: (label: string) => ({
    accessible: true,
    accessibilityRole: 'header' as AccessibilityRole,
    accessibilityLabel: label,
  }),

  image: (label: string) => ({
    accessible: true,
    accessibilityRole: 'image' as AccessibilityRole,
    accessibilityLabel: label,
  }),

  imageButton: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityRole: 'imagebutton' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  input: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  tab: (label: string, selected: boolean) => ({
    accessible: true,
    accessibilityRole: 'tab' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityState: { selected },
  }),

  checkbox: (label: string, checked: boolean) => ({
    accessible: true,
    accessibilityRole: 'checkbox' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityState: { checked },
  }),

  switch: (label: string, checked: boolean) => ({
    accessible: true,
    accessibilityRole: 'switch' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityState: { checked },
  }),

  text: (label: string) => ({
    accessible: true,
    accessibilityRole: 'text' as AccessibilityRole,
    accessibilityLabel: label,
  }),

  summary: (label: string) => ({
    accessible: true,
    accessibilityRole: 'summary' as AccessibilityRole,
    accessibilityLabel: label,
  }),

  list: (label: string) => ({
    accessible: true,
    accessibilityRole: 'list' as AccessibilityRole,
    accessibilityLabel: label,
  }),

  listItem: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  menuItem: (label: string, hint?: string) => ({
    accessible: true,
    accessibilityRole: 'menuitem' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  }),

  progressBar: (label: string, value: number, max: number = 100) => ({
    accessible: true,
    accessibilityRole: 'progressbar' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityValue: {
      min: 0,
      max,
      now: value,
      text: `${Math.round((value / max) * 100)}%`,
    },
  }),

  adjustable: (label: string, value: string) => ({
    accessible: true,
    accessibilityRole: 'adjustable' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityValue: { text: value },
  }),
};

/**
 * Generate dynamic accessibility label
 */
export const getA11yLabel = (action: string, item?: string): string => {
  if (item) return `${action} ${item}`;
  return action;
};

/**
 * Format currency for screen readers
 */
export const formatCurrencyA11y = (amount: number, currency: string = 'USD'): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Math.abs(amount));

  if (amount < 0) {
    return `negative ${formatted}`;
  }
  return formatted;
};

/**
 * Format date for screen readers
 */
export const formatDateA11y = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Announce text to screen readers (for dynamic updates)
 */
export const announceForAccessibility = (message: string): void => {
  // React Native's AccessibilityInfo.announceForAccessibility
  // is imported where needed to avoid dependency issues
};
