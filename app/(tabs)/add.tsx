// SPENDTRAK CINEMATIC EDITION - Add Tab Placeholder
// This screen is never shown - the ADD tab triggers a modal instead
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../src/design/cinematic';

export default function AddScreen() {
  // This screen should never be rendered - ADD tab shows a modal instead
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Allow AnimatedBackground to show through
  },
});
