// SPENDTRAK CINEMATIC EDITION - Goals Layout
// NO animations - blackout effect handles all transitions
import { Stack } from 'expo-router';

export default function GoalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'none' }} />
      <Stack.Screen name="[id]" options={{ animation: 'none' }} />
    </Stack>
  );
}
