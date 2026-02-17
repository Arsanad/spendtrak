import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Alert, Text as RNText, TextProps, AppState, AppStateStatus } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { supabase } from '../src/services/supabase';
import { logger } from '../src/utils/logger';
import { usePurchasesStore, forceVIPPremium } from '../src/stores/purchasesStore';
import {
    useFonts,
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Cinzel_800ExtraBold,
    Cinzel_900Black,
} from '@expo-google-fonts/cinzel';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '../src/providers/AppProviders';
import { initErrorMonitoring } from '../src/services/errorMonitoring';
import { ErrorFallback } from '../src/components/ErrorFallback';
import { OfflineBanner } from '../src/components/common/OfflineBanner';
import { offlineQueue, QueuedRequest } from '../src/services/offlineQueue';
import * as transactionService from '../src/services/transactions';
import { initUISounds } from '../src/utils/haptics';
import { ThreeBackground, BottomGlow } from '../src/components/background';
// QuantumCharacter removed from root - now only shown on dashboard
import { theme } from '../src/theme';
import { checkStorageQuota } from '../src/utils/storage';
import { isDeviceCompromised } from '../src/utils/deviceSecurity';
import { useUpgradePromptStore } from '../src/stores';
import { eventBus } from '../src/services/eventBus';

// Keep the splash screen visible while we fetch resources (must be sync before render)
SplashScreen.preventAutoHideAsync();

// Set default font for ALL React Native Text components
// This ensures Cinzel is used everywhere, even for native Text
interface TextWithDefaultProps {
    defaultProps?: Partial<TextProps & { style?: any }>;
}
(RNText as unknown as TextWithDefaultProps).defaultProps = {
    ...(RNText as unknown as TextWithDefaultProps).defaultProps,
    style: { fontFamily: 'Cinzel_400Regular' },
};

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Cinzel_400Regular,
        Cinzel_500Medium,
        Cinzel_600SemiBold,
        Cinzel_700Bold,
        Cinzel_800ExtraBold,
        Cinzel_900Black,
    });

    // Track app state for session refresh on resume
    const appState = useRef(AppState.currentState);

    // RevenueCat initialization
    const initializePurchases = usePurchasesStore(state => state.initialize);
    const refreshSubscriptionStatus = usePurchasesStore(state => state.refreshSubscriptionStatus);
    const [purchasesInitialized, setPurchasesInitialized] = useState(false);

    // Initialize deferred services (error monitoring, offline queue, sounds)
    useEffect(() => {
        const initializeServices = async () => {
            try {
                await initErrorMonitoring();
                // These can run in parallel after first render
                await Promise.all([
                    offlineQueue.initialize(),
                    initUISounds(),
                    checkStorageQuota(),
                ]);

                // Register transaction processor for offline queue
                offlineQueue.registerProcessor('transactions', async (request: QueuedRequest) => {
                    if (request.type === 'CREATE') {
                        await transactionService.createTransaction(request.data as Parameters<typeof transactionService.createTransaction>[0]);
                        logger.transaction?.info('Synced offline transaction:', request.metadata?.optimisticId);
                    }
                });

                // Jailbreak/root detection (skip in dev)
                if (!__DEV__ && isDeviceCompromised()) {
                    Alert.alert(
                        'Security Warning',
                        'This device appears to be jailbroken or rooted. Your financial data may be at risk. We recommend using SpendTrak on a secure device.',
                        [{ text: 'I Understand' }]
                    );
                }
            } catch (error) {
                // Non-fatal — app can work without these
                if (__DEV__) console.warn('Service initialization warning:', error);
            }
        };

        initializeServices();

        // Emit app opened event for Quantum Alive Experience
        eventBus.emit('app:opened', { timestamp: Date.now() });

        // Cleanup processor on unmount
        return () => {
            offlineQueue.unregisterProcessor('transactions');
        };
    }, []);

    // Initialize RevenueCat when user authenticates
    useEffect(() => {
        const initRevenueCat = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    // Initialize with user ID for entitlement tracking
                    await initializePurchases(session.user.id);
                    // DEV OVERRIDE — remove before production release
                    // Force VIP premium after initial purchases init
                    forceVIPPremium();
                    setPurchasesInitialized(true);
                    logger.purchases?.info('RevenueCat initialized for user:', session.user.id);
                } else {
                    // Initialize without user ID (anonymous mode)
                    await initializePurchases();
                    setPurchasesInitialized(true);
                    logger.purchases?.info('RevenueCat initialized in anonymous mode');
                }
            } catch (error) {
                // Don't crash app if RevenueCat fails - will work in free mode
                logger.purchases?.warn('RevenueCat initialization failed:', error);
                setPurchasesInitialized(true);
            }
        };

        initRevenueCat();

        // Listen for auth state changes to re-initialize with user ID
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user?.id) {
                try {
                    await initializePurchases(session.user.id);
                    // DEV OVERRIDE — remove before production release
                    // Force VIP premium after auth + purchases are both ready
                    forceVIPPremium();
                    logger.purchases?.info('RevenueCat re-initialized after sign in');
                    // Initialize Contextual Upgrade Engine with signup timestamp
                    useUpgradePromptStore.getState().initialize(session.user.created_at || new Date().toISOString());
                } catch (error) {
                    logger.purchases?.warn('RevenueCat re-init failed:', error);
                }
            } else if (event === 'SIGNED_OUT') {
                // Refresh to get free tier status
                await refreshSubscriptionStatus();
                logger.purchases?.info('Subscription status refreshed after sign out');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [initializePurchases, refreshSubscriptionStatus]);

    // Refresh session and subscription status when app comes back from background
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground - refresh session if needed
                logger.auth.info('App resumed, checking session...');
                eventBus.emit('app:resumed', { timestamp: Date.now() });
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        // Try to refresh if the session exists
                        await supabase.auth.refreshSession();
                        logger.auth.info('Session refreshed on app resume');

                        // Also refresh subscription status in case it changed
                        if (purchasesInitialized) {
                            await refreshSubscriptionStatus();
                            // DEV OVERRIDE — remove before production release
                            forceVIPPremium();
                            logger.purchases?.info('Subscription status refreshed on app resume');
                        }

                        // Contextual Upgrade Engine - check trial expiry and sync analytics on foreground
                        useUpgradePromptStore.getState().checkTrialExpiry();
                        useUpgradePromptStore.getState().syncAnalytics();
                    }
                } catch (error) {
                    // Don't crash on refresh error - just log it
                    logger.auth.warn('Session refresh on resume failed:', error);
                }
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [purchasesInitialized, refreshSubscriptionStatus]);

    // Safety timeout: force-hide splash after 8s to prevent infinite splash on edge cases.
    // Normal flow hides splash earlier via IntroVideo (unauth) or index.tsx (auth).
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            SplashScreen.hideAsync();
        }, 8000);
        return () => clearTimeout(timeout);
    }, []);

    // Show loading screen while fonts are loading
    if (!fontsLoaded && !fontError) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <Sentry.ErrorBoundary fallback={(props) => <ErrorFallback {...props} />}>
            <AppProviders>
                <ThreeBackground>
                    <BottomGlow />
                    <StatusBar style="light" />

                    {/* Offline Banner - shows when device is offline */}
                    <OfflineBanner />

                    {/* Main App Navigation - NO animations, blackout handles all transitions */}
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: styles.content,
                            animation: 'none',
                            gestureEnabled: true,
                            gestureDirection: 'horizontal',
                            fullScreenGestureEnabled: true,
                        }}
                    >
                        {/* Entry point - decides routing based on auth state */}
                        <Stack.Screen name="index" options={{ animation: 'none' }} />
                        {/* Auth flow - intro video, onboarding, sign in */}
                        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
                        {/* Post-auth onboarding tunnel */}
                        <Stack.Screen name="(onboarding)" options={{ animation: 'none' }} />
                        {/* Main app tabs */}
                        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                        {/* Modal screens */}
                        <Stack.Screen
                            name="(modals)"
                            options={{
                                presentation: 'modal',
                                animation: 'none',
                            }}
                        />
                        {/* Settings screens */}
                        <Stack.Screen
                            name="settings"
                            options={{
                                animation: 'none',
                            }}
                        />
                        {/* Transaction detail - deep link support */}
                        <Stack.Screen
                            name="transaction"
                            options={{
                                animation: 'none',
                            }}
                        />
                        {/* Not found */}
                        <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
                    </Stack>

                    {/* QUANTUM Character removed - now only on dashboard */}
                </ThreeBackground>
            </AppProviders>
        </Sentry.ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        backgroundColor: 'transparent', // Allow AnimatedBackground to show through
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.primary,
    },
});
