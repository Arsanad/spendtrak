/**
 * ErrorFallback - Shown when the app encounters an unrecoverable error.
 * Used as the fallback for Sentry.ErrorBoundary in the root layout.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../design/cinematic';

interface Props {
  error: unknown;
  componentStack: string | null;
  eventId: string | null;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: Props) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{errorMessage}</Text>

      <Pressable style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.semantic.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: Colors.void,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
  },
});
