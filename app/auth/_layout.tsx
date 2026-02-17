// Auth callback route layout
// NO animations - blackout effect handles all transitions
import { Stack } from 'expo-router';
import { Colors } from '../../src/design/cinematic';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: Colors.void },
      }}
    >
      <Stack.Screen name="callback" options={{ animation: 'none' }} />
      <Stack.Screen name="confirm" options={{ animation: 'none' }} />
    </Stack>
  );
}
