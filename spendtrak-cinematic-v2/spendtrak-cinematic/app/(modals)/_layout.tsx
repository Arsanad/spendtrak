// SPENDTRAK CINEMATIC EDITION - Modals Layout
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/design/cinematic';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.void },
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="camera" options={{ animation: 'fade' }} />
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="add-subscription" />
      <Stack.Screen name="add-budget" />
      <Stack.Screen name="ai-consultant" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
