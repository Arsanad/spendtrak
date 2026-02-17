// SPENDTRAK CINEMATIC EDITION - Profile Screen
import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Image, Alert, Pressable, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius } from '../../src/design/cinematic';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Header } from '../../src/components/navigation';
import { ProfileIcon, CameraIcon, CloseIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useAuthStore } from '../../src/stores/authStore';
import { successBuzz } from '../../src/utils/haptics';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  // Get user from auth store
  const { user, updateProfile, isLoading } = useAuthStore();

  // Initialize form state from user data
  const [name, setName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar_url || null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Save profile changes
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('settings.nameRequired') || 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        display_name: name.trim(),
        avatar_url: profileImage || undefined,
      });
      successBuzz(); // Play success sound
      Alert.alert(t('common.success') || 'Success', t('settings.profileSaved') || 'Profile saved successfully');
      router.back();
    } catch (error) {
      logger.auth.error('Save profile error:', error);
      Alert.alert(t('common.error'), t('errors.generic') || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }, [name, profileImage, updateProfile, t, router]);

  const pickImage = () => {
    setShowPhotoModal(true);
  };

  const openCamera = async () => {
    setShowPhotoModal(false);

    // Small delay to ensure modal is fully closed before launching camera
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('camera.cameraAccessRequired'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      logger.general.error('Camera error:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  const openGallery = async () => {
    setShowPhotoModal(false);

    // Small delay to ensure modal is fully closed before launching gallery
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('errors.generic'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      logger.general.error('Gallery error:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('settings.profile')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickImage} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <ProfileIcon size={48} color={Colors.text.muted} />
            )}
          </Pressable>
          <Button variant="ghost" size="small" onPress={pickImage}>{t('settings.editProfile')}</Button>
        </View>

        {/* Form */}
        <GlassCard variant="default" style={styles.formCard}>
          <Input
            label={t('settings.name')}
            placeholder={t('settings.name')}
            value={name}
            onChangeText={setName}
          />

          <Input
            label={t('settings.email')}
            placeholder={t('settings.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </GlassCard>

        <Button
          variant="primary"
          size="large"
          fullWidth
          style={styles.saveButton}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          {t('common.save')}
        </Button>

        <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo Picker Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <GradientText variant="bright" style={styles.modalTitle}>{t('settings.editProfile')}</GradientText>
              <Pressable onPress={() => setShowPhotoModal(false)} style={styles.modalClose}>
                <CloseIcon size={20} color={Colors.text.muted} />
              </Pressable>
            </View>

            <GradientText variant="muted" style={styles.modalSubtitle}>{t('common.filter')}</GradientText>

            <View style={styles.modalOptions}>
              <Pressable style={styles.modalOption} onPress={openCamera}>
                <View style={styles.optionIcon}>
                  <CameraIcon size={24} color={Colors.primary} />
                </View>
                <GradientText variant="bright">{t('transactions.addPhoto')}</GradientText>
              </Pressable>

              <Pressable style={styles.modalOption} onPress={openGallery}>
                <View style={styles.optionIcon}>
                  <ProfileIcon size={24} color={Colors.primary} />
                </View>
                <GradientText variant="bright">{t('common.viewMore')}</GradientText>
              </Pressable>
            </View>

            <Button variant="ghost" onPress={() => setShowPhotoModal(false)} style={styles.cancelButton}>
              {t('common.cancel')}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.transparent.dark60,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  formCard: {
    marginBottom: Spacing.xl,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.darker,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalClose: {
    padding: Spacing.xs,
  },
  modalSubtitle: {
    marginBottom: Spacing.lg,
  },
  modalOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.transparent.dark40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.transparent.neon10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cancelButton: {
    marginTop: Spacing.sm,
  },
});
