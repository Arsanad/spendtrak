/**
 * AppProviders Component
 * Combines all context providers to reduce nesting in _layout.tsx
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AnimationProvider } from '@/context/AnimationContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { TransitionProvider } from '@/context/TransitionContext';
import { QuantumProvider } from '@/context/QuantumContext';
import { QuantumBridge } from '@/components/quantum/QuantumBridge';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Combined provider component that wraps all app context providers
 * Reduces nesting depth in the root layout
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AnimationProvider>
        <NetworkProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <TransitionProvider>
                <QuantumProvider>
                  <QuantumBridge />
                  {children}
                </QuantumProvider>
              </TransitionProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </NetworkProvider>
      </AnimationProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default AppProviders;
