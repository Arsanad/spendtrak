/**
 * QuantumAliveOverlay
 * Composite component that renders all Quantum alive UI elements.
 * Place this in the tab layout to add Quantum presence across all tabs.
 * Initializes the Quantum Reactor and connects it to the presence store.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { QuantumToast } from './QuantumToast';
import { QuantumCelebration } from './QuantumCelebration';
import { initQuantumReactor, destroyQuantumReactor, setQuantumResponseHandler } from '@/services/quantumReactor';
import { useQuantumPresenceStore } from '@/stores/quantumPresenceStore';
import type { QuantumResponse } from '@/services/quantumReactor';

export const QuantumAliveOverlay: React.FC = () => {
  const showToast = useQuantumPresenceStore((s) => s.showToast);
  const showCelebration = useQuantumPresenceStore((s) => s.showCelebration);

  useEffect(() => {
    // Initialize the Quantum Reactor
    initQuantumReactor();

    // Connect Reactor output to Presence Store
    const unsubHandler = setQuantumResponseHandler((response: QuantumResponse) => {
      if (response.celebration) {
        showCelebration(response);
      } else {
        showToast(response);
      }
    });

    return () => {
      unsubHandler();
      destroyQuantumReactor();
    };
  }, [showToast, showCelebration]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <QuantumToast />
      <QuantumCelebration />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    pointerEvents: 'box-none',
  },
});

export default QuantumAliveOverlay;
