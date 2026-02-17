// SPENDTRAK CINEMATIC EDITION - Camera Modal (Receipt Scanning)
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { Button, IconButton } from '../../src/components/ui/Button';
import { CloseIcon, CameraIcon } from '../../src/components/icons';
import { AnimatedScanIcon } from '../../src/components/icons/AnimatedIcons';

export default function CameraModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      // Process photo with OCR
      console.log('Photo taken:', photo?.uri);
      router.push({
        pathname: '/(modals)/add-expense',
        params: { receiptUri: photo?.uri },
      });
    } catch (error) {
      console.error('Failed to take picture:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <GradientText variant="muted">Loading camera...</GradientText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionContent}>
          <CameraIcon size={64} color={Colors.text.tertiary} />
          <GradientText variant="bright" style={styles.permissionTitle}>Camera Access Required</GradientText>
          <GradientText variant="muted" style={styles.permissionText}>
            SpendTrak needs camera access to scan your receipts and automatically extract transaction details.
          </GradientText>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            Grant Permission
          </Button>
          <Button variant="ghost" onPress={() => router.back()} style={styles.cancelButton}>
            Cancel
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top gradient */}
          <LinearGradient
            colors={[Colors.void, 'transparent']}
            style={[styles.gradientTop, { paddingTop: insets.top }]}
          >
            <View style={styles.header}>
              <IconButton
                icon={<CloseIcon size={24} color={Colors.text.primary} />}
                onPress={() => router.back()}
                variant="default"
              />
              <GradientText variant="bright" style={styles.title}>Scan Receipt</GradientText>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          {/* Scan frame */}
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Scan line animation */}
              <View style={styles.scanLineContainer}>
                <AnimatedScanIcon size={200} active />
              </View>
            </View>
            <GradientText variant="muted" style={styles.hint}>
              Position the receipt within the frame
            </GradientText>
          </View>

          {/* Bottom gradient with capture button */}
          <LinearGradient
            colors={['transparent', Colors.void]}
            style={[styles.gradientBottom, { paddingBottom: insets.bottom + Spacing.lg }]}
          >
            <Pressable
              onPress={takePicture}
              disabled={isCapturing}
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            >
              <LinearGradient
                colors={Colors.gradients.buttonPrimary}
                style={styles.captureButtonGradient}
              >
                <View style={styles.captureButtonInner} />
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  cancelButton: {
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  gradientTop: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {},
  scanFrameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 380,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.neon,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: BorderRadius.md,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: BorderRadius.md,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: BorderRadius.md,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: BorderRadius.md,
  },
  scanLineContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -100,
    marginLeft: -100,
    opacity: 0.3,
  },
  hint: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  gradientBottom: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 4,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonGradient: {
    flex: 1,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.void,
    borderWidth: 2,
    borderColor: Colors.neon,
  },
});
