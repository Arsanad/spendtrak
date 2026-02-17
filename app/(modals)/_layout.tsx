// SPENDTRAK CINEMATIC EDITION - Modals Layout
// NO animations - blackout effect handles all transitions
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/design/cinematic';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' }, // Allow AnimatedBackground to show through
        animation: 'none',
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="camera" options={{ animation: 'none' }} />
      <Stack.Screen name="add-expense" options={{ animation: 'none' }} />
      <Stack.Screen name="add-subscription" options={{ animation: 'none' }} />
      <Stack.Screen name="add-budget" options={{ animation: 'none' }} />
      <Stack.Screen name="add-debt" options={{ animation: 'none' }} />
      <Stack.Screen name="add-bill" options={{ animation: 'none' }} />
      <Stack.Screen name="ai-consultant" options={{ animation: 'none' }} />
      <Stack.Screen name="upgrade" options={{ animation: 'none' }} />
    </Stack>
  );
}
