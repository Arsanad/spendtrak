// SPENDTRAK CINEMATIC EDITION - Camera Modal (Receipt Scanning)
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import { logger } from '../../src/utils/logger';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { Button, IconButton } from '../../src/components/ui/Button';
import { CloseIcon, CameraIcon } from '../../src/components/icons';
import { AnimatedScanIcon } from '../../src/components/icons/AnimatedIcons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useReceiptStore } from '../../src/stores/receiptStore';
import { OfflineReceiptBanner } from '../../src/components/receipt/OfflineReceiptBanner';
import { hasPremiumAccess } from '../../src/stores/tierStore';

export default function CameraModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  // Receipt store for offline handling
  const {
    initialize: initReceiptStore,
    scanReceipt: scanReceiptWithOffline,
    queueReceiptForLater,
    isOnline,
    pendingReceiptsCount,
    isScanning,
  } = useReceiptStore();

  // Initialize receipt store on mount
  useEffect(() => {
    // Use getState() to avoid dependency warning - we only want to run on mount
    useReceiptStore.getState().initialize();
  }, []);

  const handleCameraError = (error: Error, context: string) => {
    logger.receipt.error(`${context}:`, error);
    Alert.alert(
      t('camera.cameraError') || 'Camera Error',
      t('camera.cameraErrorDescription') || 'Unable to access camera. Please check your permissions and try again.',
      [
        { text: t('common.cancel') || 'Cancel', onPress: () => router.back(), style: 'cancel' },
        { text: t('common.tryAgain') || 'Try Again', onPress: () => setIsCapturing(false) }
      ]
    );
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();

      if (!photo?.uri) {
        throw new Error('No photo URI returned from camera');
      }

      logger.receipt.info('Photo taken:', photo.uri);

      // Attempt to scan with offline handling
      const result = await scanReceiptWithOffline(photo.uri);

      if (result.success) {
        // Online scan succeeded - go to add expense with scanned data
        router.push({
          pathname: '/(modals)/add-expense',
          params: { receiptUri: photo.uri },
        });
      } else if (result.error === 'OFFLINE_QUEUED') {
        // Receipt queued for later processing
        Alert.alert(
          t('camera.offlineTitle') || 'Receipt Saved Offline',
          t('camera.offlineMessage') || 'Your receipt has been saved and will be processed when you\'re back online.',
          [
            {
              text: t('camera.captureAnother') || 'Capture Another',
              onPress: () => setIsCapturing(false),
            },
            {
              text: t('common.done') || 'Done',
              onPress: () => router.back(),
              style: 'default',
            },
          ]
        );
      } else {
        // Scan failed for other reasons - still allow manual entry
        Alert.alert(
          t('camera.scanFailed') || 'Scan Failed',
          result.error || t('camera.scanFailedMessage') || 'Unable to scan receipt. You can still add the expense manually.',
          [
            {
              text: t('common.cancel') || 'Cancel',
              style: 'cancel',
            },
            {
              text: t('camera.addManually') || 'Add Manually',
              onPress: () => router.push({
                pathname: '/(modals)/add-expense',
                params: { receiptUri: photo.uri },
              }),
            },
          ]
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to capture photo');
      handleCameraError(err, 'Failed to take picture');
    } finally {
      setIsCapturing(false);
    }
  };

  // Premium gate: AI receipt scanning is a premium-only feature
  if (!hasPremiumAccess()) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionContent}>
          <CameraIcon size={64} color={Colors.text.tertiary} />
          <GradientText variant="bright" style={styles.permissionTitle}>Premium Feature</GradientText>
          <GradientText variant="muted" style={styles.permissionText}>
            AI receipt scanning is available with Premium. Upgrade to scan receipts and auto-extract transaction details.
          </GradientText>
          <Button onPress={() => router.push('/settings/upgrade' as any)} style={styles.permissionButton}>
            Upgrade to Premium
          </Button>
          <Button variant="ghost" onPress={() => router.back()} style={styles.cancelButton}>
            {t('common.cancel')}
          </Button>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <GradientText variant="muted">{t('camera.loadingCamera')}</GradientText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionContent}>
          <CameraIcon size={64} color={Colors.text.tertiary} />
          <GradientText variant="bright" style={styles.permissionTitle}>{t('camera.cameraAccessRequired')}</GradientText>
          <GradientText variant="muted" style={styles.permissionText}>
            {t('camera.cameraAccessDescription')}
          </GradientText>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            {t('camera.grantPermission')}
          </Button>
          <Button variant="ghost" onPress={() => router.back()} style={styles.cancelButton}>
            {t('common.cancel')}
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
              <GradientText variant="bright" style={styles.title}>{t('camera.scanReceipt')}</GradientText>
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
              {t('camera.positionReceipt')}
            </GradientText>
          </View>

          {/* Offline Banner */}
          {pendingReceiptsCount > 0 && (
            <OfflineReceiptBanner
              onPress={() => {
                // Receipt queue screen not yet implemented - show info alert
                Alert.alert(
                  t('camera.pendingReceipts') || 'Pending Receipts',
                  t('camera.pendingReceiptsMessage') || `You have ${pendingReceiptsCount} receipt(s) waiting to be processed.`,
                  [{ text: 'OK' }]
                );
              }}
              style={styles.offlineBanner}
            />
          )}

          {/* Offline indicator */}
          {!isOnline && (
            <View style={styles.offlineIndicator}>
              <GradientText variant="bronze" style={styles.offlineText}>
                {t('camera.offlineMode') || 'Offline Mode - Receipts will be saved locally'}
              </GradientText>
            </View>
          )}

          {/* Bottom gradient with capture button */}
          <LinearGradient
            colors={['transparent', Colors.void]}
            style={[styles.gradientBottom, { paddingBottom: insets.bottom + Spacing.lg }]}
          >
            <Pressable
              onPress={takePicture}
              disabled={isCapturing || isScanning}
              style={[styles.captureButton, (isCapturing || isScanning) && styles.captureButtonDisabled]}
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
  offlineBanner: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 160,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: `${Colors.semantic.warning}20`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: FontSize.xs,
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
