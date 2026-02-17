// SPENDTRAK LUXURY EDITION - Settings Layout
// NO animations - blackout effect handles all transitions
import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' }, // Allow AnimatedBackground to show through
        // NO animation - blackout handles transitions
        animation: 'none',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="budgets" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="language" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="help" />
      <Stack.Screen name="export" />
      <Stack.Screen name="daily-limit" />
      <Stack.Screen name="connect-email" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="debts" />
      <Stack.Screen name="bills" />
      <Stack.Screen name="net-worth" />
      <Stack.Screen name="investments" />
      <Stack.Screen name="household" />
      <Stack.Screen name="subscriptions" />
    </Stack>
  );
}
