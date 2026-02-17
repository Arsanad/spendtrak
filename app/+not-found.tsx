/**
 * Not Found Screen
 * Catches unmatched routes and redirects appropriately
 * This helps avoid the "Unmatched Route" crash in expo-router v6
 */

import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/stores';

export default function NotFoundScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const rootNavigationState = useRootNavigationState();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Wait for navigation state to be ready
    if (!rootNavigationState?.key) {
      return;
    }

    // Only redirect once
    if (hasRedirected.current) {
      return;
    }

    // Redirect based on auth state
    const timer = setTimeout(() => {
      hasRedirected.current = true;
      if (!user) {
        router.replace('/(auth)/welcome' as any);
      } else if (!user.onboarding_completed) {
        // Redirect to welcome to complete onboarding
        router.replace('/(auth)/welcome' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, rootNavigationState?.key]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00C853" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#00C853',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Cinzel_400Regular',
  },
});
