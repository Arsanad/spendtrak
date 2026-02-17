// SPENDTRAK CINEMATIC EDITION - Modals Layout
// Location: app/(modals)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/design/cinematic';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
        contentStyle: { backgroundColor: Colors.void },
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}
    >
      <Stack.Screen 
        name="camera" 
        options={{ 
          animation: 'fade',
          presentation: 'fullScreenModal',
        }} 
      />
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="add-subscription" />
      <Stack.Screen name="add-budget" />
      <Stack.Screen 
        name="ai-consultant" 
        options={{ 
          presentation: 'fullScreenModal',
        }} 
      />
    </Stack>
  );
}
