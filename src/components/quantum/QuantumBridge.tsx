/**
 * QuantumBridge Component
 * Bridges the Zustand behaviorStore with the React QuantumContext
 *
 * This component listens to behaviorStore acknowledgment/intervention triggers
 * and forwards them to the QuantumContext to make QUANTUM come alive!
 */

import React, { useEffect, useRef } from 'react';
import { useBehaviorStore, useQuantumAcknowledgment, useHasActiveIntervention } from '@/stores';
import { useQuantumActions } from '@/context/QuantumContext';

export const QuantumBridge: React.FC = () => {
  const quantumActions = useQuantumActions();

  // Get acknowledgment state from behaviorStore
  const { message: acknowledgmentMessage, visible: showAcknowledgment } = useQuantumAcknowledgment();
  const hideAcknowledgment = useBehaviorStore((state) => state.hideAcknowledgment);

  // Get intervention state
  const hasActiveIntervention = useHasActiveIntervention();
  const activeIntervention = useBehaviorStore((state) => state.activeIntervention);

  // Track if we've already handled the current acknowledgment
  const lastAckMessage = useRef<string | null>(null);
  const lastInterventionId = useRef<string | null>(null);

  // Bridge acknowledgments to QUANTUM character
  useEffect(() => {
    if (showAcknowledgment && acknowledgmentMessage && acknowledgmentMessage !== lastAckMessage.current) {
      lastAckMessage.current = acknowledgmentMessage;

      // Trigger QUANTUM to fly to center, speak, and return!
      quantumActions.acknowledge(acknowledgmentMessage);

      // Clear the behaviorStore state after a delay to let animation play
      setTimeout(() => {
        hideAcknowledgment();
        lastAckMessage.current = null;
      }, 3000);
    }
  }, [showAcknowledgment, acknowledgmentMessage, quantumActions, hideAcknowledgment]);

  // Bridge interventions to QUANTUM character
  useEffect(() => {
    if (hasActiveIntervention && activeIntervention?.messageContent) {
      const interventionId = activeIntervention.transactionId || activeIntervention.messageKey;

      if (interventionId !== lastInterventionId.current) {
        lastInterventionId.current = interventionId || null;

        // Show intervention (QUANTUM flies to center and speaks with alert type)
        quantumActions.speak(activeIntervention.messageContent, 'alert');
      }
    } else if (!hasActiveIntervention && lastInterventionId.current) {
      // Intervention was dismissed, return QUANTUM to corner
      quantumActions.dismiss();
      lastInterventionId.current = null;
    }
  }, [hasActiveIntervention, activeIntervention, quantumActions]);

  // This component doesn't render anything - it's just a bridge
  return null;
};

export default QuantumBridge;
