// SPENDTRAK CINEMATIC EDITION - Household Screen (Fully Functional)
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Alert, ActivityIndicator, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { useCurrency } from '../../src/context/CurrencyContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { Header } from '../../src/components/navigation';
import { EmptyState } from '../../src/components/premium';
import {
  GroupIcon,
  ProfileIcon,
  PlusIcon,
  ChevronRightIcon,
  EmailIcon,
  CloseIcon,
} from '../../src/components/icons';
import { useHouseholdStore } from '../../src/stores/householdStore';
import { successBuzz, errorBuzz } from '../../src/utils/haptics';
import type { HouseholdMemberWithUser, HouseholdInvitation } from '../../src/types';
import { useTransition } from '../../src/context/TransitionContext';

export default function HouseholdScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyCode } = useCurrency();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  // Store state
  const {
    households,
    currentHousehold,
    members,
    myMembership,
    invitations,
    isLoading,
    fetchHouseholds,
    selectHousehold,
    createHousehold,
    inviteMember,
    removeMember,
    cancelInvitation,
  } = useHouseholdStore();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMemberWithUser | null>(null);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Fetch households on mount
  useFocusEffect(
    useCallback(() => {
      fetchHouseholds();
    }, [])
  );

  // Auto-select first household if none selected
  useEffect(() => {
    if (households.length > 0 && !currentHousehold) {
      // Use getState() to avoid stale closure issues
      useHouseholdStore.getState().selectHousehold(households[0].id);
    }
  }, [households, currentHousehold]);

  // Handle create household
  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return;

    setIsCreating(true);
    try {
      await createHousehold({
        name: newHouseholdName.trim(),
        currency: currencyCode,
        settings: {},
        is_active: true,
      });
      await successBuzz();
      setNewHouseholdName('');
      setShowCreateModal(false);
    } catch (err) {
      await errorBuzz();
      Alert.alert(t('common.error'), t('settings.failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  // Handle invite member
  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      await errorBuzz();
      Alert.alert(t('settings.invalidEmail'), t('settings.invalidEmailMessage'));
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember(inviteEmail.trim().toLowerCase(), 'member');
      await successBuzz();
      setInviteEmail('');
      setShowInviteModal(false);
      Alert.alert(t('common.success'), t('settings.invitationSent'));
    } catch (err) {
      await errorBuzz();
      Alert.alert(t('common.error'), t('settings.failedToSendInvite'));
    } finally {
      setIsInviting(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember(memberToRemove.id);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    } catch (err) {
      Alert.alert(t('common.error'), t('settings.failedToRemoveMember'));
    }
  };

  // Handle cancel invitation
  const handleCancelInvitation = async (invitation: HouseholdInvitation) => {
    Alert.alert(
      t('settings.cancelInvitation'),
      t('settings.cancelInvitationConfirm', { email: invitation.invited_email }),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('settings.yesCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelInvitation(invitation.id);
            } catch (err) {
              Alert.alert(t('common.error'), t('settings.failedToCancelInvite'));
            }
          },
        },
      ]
    );
  };

  const isOwner = myMembership?.role === 'owner';
  const canManageMembers = myMembership?.can_manage_members || isOwner;

  // Show loading state
  if (isLoading && !currentHousehold) {
    return (
      <View style={styles.container}>
        <Header title={t('settings.household')} showBack onBack={() => triggerBlackout(() => router.back())} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neon} />
          <Text style={styles.loadingText}>{t('settings.loadingHousehold')}</Text>
        </View>
      </View>
    );
  }

  // Show empty state if no household
  if (!currentHousehold && !isLoading) {
    return (
      <View style={styles.container}>
        <Header title={t('settings.household')} showBack onBack={() => triggerBlackout(() => router.back())} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <EmptyState
            icon={<GroupIcon size={64} color={Colors.text.tertiary} />}
            title={t('settings.noHouseholdYet')}
            description={t('settings.noHouseholdDescription')}
          />

          <Button
            variant="primary"
            fullWidth
            icon={<PlusIcon size={20} color={Colors.void} />}
            onPress={() => setShowCreateModal(true)}
            style={styles.createButton}
          >
            {t('settings.createHousehold')}
          </Button>
        </ScrollView>

        {/* Create Household Modal */}
        <CreateHouseholdModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          name={newHouseholdName}
          onNameChange={setNewHouseholdName}
          onSubmit={handleCreateHousehold}
          isLoading={isCreating}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t('settings.householdTitle')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Hero Card */}
        <GlassCard variant="elevated" style={styles.heroCard}>
          <GroupIcon size={48} color={Colors.neon} />
          <GradientText variant="bright" style={styles.heroTitle}>
            {currentHousehold?.name || t('settings.sharedFinances')}
          </GradientText>
          <GradientText variant="muted" style={styles.heroSubtitle}>
            {t('settings.householdDescription')}
          </GradientText>
        </GlassCard>

        {/* Members Section */}
        <GradientText variant="muted" style={styles.sectionLabel}>
          {t('settings.members')} ({members.length})
        </GradientText>

        <GlassCard variant="default" style={styles.listCard}>
          {members.map((member, index) => (
            <Pressable
              key={member.id}
              style={[styles.memberItem, index < members.length - 1 && styles.itemBorder]}
              onLongPress={() => {
                if (canManageMembers && member.role !== 'owner' && member.user_id !== myMembership?.user_id) {
                  setMemberToRemove(member);
                  setShowRemoveMemberModal(true);
                }
              }}
            >
              <View style={styles.memberAvatar}>
                <ProfileIcon size={24} color={Colors.neon} />
              </View>
              <View style={styles.memberInfo}>
                <GradientText variant="bright" style={styles.memberName}>
                  {member.user?.display_name || member.user?.email || t('common.unknown')}
                  {member.user_id === myMembership?.user_id && ` (${t('settings.you')})`}
                </GradientText>
                <GradientText variant="muted" style={styles.memberEmail}>
                  {member.user?.email || ''}
                </GradientText>
              </View>
              <View style={[styles.memberRole, member.role === 'owner' && styles.ownerRole]}>
                <GradientText
                  variant={member.role === 'owner' ? 'neon' : 'subtle'}
                  style={styles.roleText}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </GradientText>
              </View>
            </Pressable>
          ))}
        </GlassCard>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <>
            <GradientText variant="muted" style={styles.sectionLabel}>
              {t('settings.pendingInvitations')} ({invitations.length})
            </GradientText>

            <GlassCard variant="default" style={styles.listCard}>
              {invitations.map((invitation, index) => (
                <View
                  key={invitation.id}
                  style={[styles.invitationItem, index < invitations.length - 1 && styles.itemBorder]}
                >
                  <View style={styles.invitationAvatar}>
                    <EmailIcon size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.invitationInfo}>
                    <GradientText variant="bright" style={styles.invitationEmail}>
                      {invitation.invited_email}
                    </GradientText>
                    <GradientText variant="muted" style={styles.invitationStatus}>
                      {t('settings.pending')} • {t('settings.expires')} {new Date(invitation.expires_at).toLocaleDateString()}
                    </GradientText>
                  </View>
                  {canManageMembers && (
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => handleCancelInvitation(invitation)}
                    >
                      <CloseIcon size={18} color={Colors.semantic.expense} />
                    </Pressable>
                  )}
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* Invite Button */}
        {canManageMembers && (
          <Button
            variant="secondary"
            fullWidth
            icon={<PlusIcon size={20} color={Colors.neon} />}
            onPress={() => setShowInviteModal(true)}
            style={styles.inviteButton}
          >
            {t('settings.inviteMember')}
          </Button>
        )}

        {/* Settings Section */}
        <GradientText variant="muted" style={styles.sectionLabel}>
          {t('settings.title')}
        </GradientText>

        <GlassCard variant="default" style={styles.listCard}>
          <Pressable
            style={styles.settingItem}
            onPress={() => triggerBlackout(() => router.push('/settings/household-categories' as any))}
          >
            <GradientText variant="subtle" style={styles.settingText}>
              {t('settings.sharedCategories')}
            </GradientText>
            <ChevronRightIcon size={20} color={Colors.text.tertiary} />
          </Pressable>
          <View style={styles.itemBorder} />
          <Pressable
            style={styles.settingItem}
            onPress={() => triggerBlackout(() => router.push('/settings/household-notifications' as any))}
          >
            <GradientText variant="subtle" style={styles.settingText}>
              {t('settings.notificationPreferences')}
            </GradientText>
            <ChevronRightIcon size={20} color={Colors.text.tertiary} />
          </Pressable>
        </GlassCard>

        <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Household Modal */}
      <CreateHouseholdModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        name={newHouseholdName}
        onNameChange={setNewHouseholdName}
        onSubmit={handleCreateHousehold}
        isLoading={isCreating}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
        }}
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        onSubmit={handleInviteMember}
        isLoading={isInviting}
      />

      {/* Remove Member Confirmation */}
      <ConfirmationModal
        visible={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}
        onConfirm={handleRemoveMember}
        title={t('settings.removeMember')}
        message={t('settings.removeMemberConfirm', { name: memberToRemove?.user?.display_name || memberToRemove?.user?.email || '' })}
        confirmText={t('settings.removeMember')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </View>
  );
}

// Create Household Modal Component
const CreateHouseholdModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ visible, onClose, name, onNameChange, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <GlassCard variant="elevated" style={styles.modalContent}>
        <GradientText variant="bright" style={styles.modalTitle}>
          {t('settings.createHousehold')}
        </GradientText>
        <GradientText variant="muted" style={styles.modalDescription}>
          {t('settings.createHouseholdDescription')}
        </GradientText>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={onNameChange}
            placeholder={t('settings.householdNamePlaceholder')}
            placeholderTextColor={Colors.text.disabled}
            autoFocus
          />
        </View>

        <View style={styles.modalButtons}>
          <Button variant="ghost" onPress={onClose} style={styles.modalButton}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onPress={onSubmit}
            disabled={!name.trim() || isLoading}
            style={styles.modalButton}
          >
            {isLoading ? t('settings.creating') : t('settings.create')}
          </Button>
        </View>
      </GlassCard>
    </View>
  );
};

// Invite Member Modal Component
const InviteMemberModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ visible, onClose, email, onEmailChange, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <GlassCard variant="elevated" style={styles.modalContent}>
        <GradientText variant="bright" style={styles.modalTitle}>
          {t('settings.inviteMember')}
        </GradientText>
        <GradientText variant="muted" style={styles.modalDescription}>
          {t('settings.inviteMemberDescription')}
        </GradientText>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={onEmailChange}
            placeholder={t('settings.inviteEmailPlaceholder')}
            placeholderTextColor={Colors.text.disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
        </View>

        <View style={styles.modalButtons}>
          <Button variant="ghost" onPress={onClose} style={styles.modalButton}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onPress={onSubmit}
            disabled={!email.trim() || isLoading}
            style={styles.modalButton}
          >
            {isLoading ? t('settings.sending') : t('settings.sendInvite')}
          </Button>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  gateContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    marginTop: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 22,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.transparent.neon10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
  },
  memberRole: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.transparent.deep20,
    borderRadius: 12,
  },
  ownerRole: {
    backgroundColor: Colors.transparent.neon10,
    borderWidth: 1,
    borderColor: Colors.neon,
  },
  roleText: {
    fontSize: 12,
  },
  invitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  invitationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.transparent.deep20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    marginBottom: 2,
  },
  invitationStatus: {
    fontSize: 11,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  inviteButton: {
    marginTop: Spacing.lg,
  },
  createButton: {
    marginTop: Spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  settingText: {
    flex: 1,
  },

  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.h4,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    backgroundColor: Colors.transparent.dark40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    padding: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
