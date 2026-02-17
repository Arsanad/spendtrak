/**
 * SpendTrak Behavioral Engine v2.0
 * ReEngagementModal - Gentle welcome back for returning users
 *
 * Philosophy: Mirror is still here. Quiet as always.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface ReEngagementModalProps {
  visible: boolean;
  onDismiss: () => void;
  daysAway?: number;
}

export function ReEngagementModal({ visible, onDismiss, daysAway }: ReEngagementModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(onDismiss);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.headline}>Welcome back.</Text>
          <Text style={styles.subline}>The mirror is still here.{'\n'}Quiet as always.</Text>
          <TouchableOpacity style={styles.button} onPress={handleDismiss} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    backgroundColor: '#0A0A0A', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.2)',
    padding: 32, alignItems: 'center', maxWidth: 300,
  },
  headline: { color: '#FFFFFF', fontSize: 22, fontWeight: '600', marginBottom: 12 },
  subline: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: {
    paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.4)', backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  buttonText: { color: '#00FF88', fontSize: 15, fontWeight: '600' },
});

export default ReEngagementModal;
