// SPENDTRAK CINEMATIC EDITION - Connect Email Screen
// Gmail: OAuth (one-tap), Outlook: OAuth (one-tap), iCloud: Email Forwarding
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize } from '../../src/design/cinematic';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { Header } from '../../src/components/navigation';
import { EMAIL_PROVIDERS, EmailProvider } from '../../src/config/emailProviders';
import { emailImportService, EmailConnection } from '../../src/services/emailImport';
import { supabase } from '../../src/services/supabase';
import {
  EmailProviderCard,
  ConnectedEmailCard,
} from '../../src/components/email';
import { hasPremiumAccess } from '../../src/stores/tierStore';

export default function ConnectEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();

  // ============================================
  // STATE
  // ============================================
  const [connectedEmails, setConnectedEmails] = useState<EmailConnection[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // iCloud forwarding state
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [forwardingLastEmail, setForwardingLastEmail] = useState<string | null>(null);

  const forwardingAddress = userId ? `receipts-${userId}@spendtrak.app` : '';

  // ============================================
  // DATA LOADING
  // ============================================
  const loadConnectedEmails = useCallback(async () => {
    const emails = await emailImportService.getConnectedEmails();
    setConnectedEmails(emails);
    setLoading(false);
  }, []);

  const loadForwardingStatus = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('source', 'email')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setForwardingLastEmail(data[0].created_at);

      // Update the iCloud connection's last_sync_at so the ConnectedEmailCard shows it
      const forwardingEmail = `receipts-${uid}@spendtrak.app`;
      await supabase
        .from('email_connections_oauth')
        .update({
          last_sync_at: data[0].created_at,
          last_sync_status: 'success',
        })
        .eq('user_id', uid)
        .eq('email', forwardingEmail);
    }
  }, []);

  useEffect(() => {
    loadConnectedEmails();

    // Load user ID for forwarding address
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadForwardingStatus(user.id);
      }
    })();
  }, [loadConnectedEmails, loadForwardingStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConnectedEmails();
    setRefreshing(false);
  }, [loadConnectedEmails]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleProviderSelect = async (provider: EmailProvider) => {
    // OAuth providers - start flow immediately
    if (provider.useOAuth) {
      setConnecting(true);

      const result = provider.id === 'outlook'
        ? await emailImportService.connectOutlookOAuth()
        : await emailImportService.connectGmailOAuth();

      setConnecting(false);

      const providerName = provider.id === 'outlook' ? 'Outlook' : 'Gmail';

      if (result.success) {
        Alert.alert(
          '✓ Connected!',
          `${providerName} connected successfully!\n\nYour receipts will now import automatically in real-time.`,
          [{ text: 'OK', onPress: loadConnectedEmails }]
        );
      } else if (result.error !== 'Cancelled') {
        Alert.alert(
          'Connection Failed',
          result.error || `Could not connect to ${providerName}. Please try again.`
        );
      }
      return;
    }

    // iCloud forwarding - register connection and show setup
    if (provider.useForwarding) {
      setSelectedProvider(provider);
      // Register iCloud forwarding in the database so it appears in Connected Emails
      emailImportService.registerICloudForwarding().then((result) => {
        if (result.success) {
          loadConnectedEmails();
        }
      });
      return;
    }
  };

  const handleSync = async (connection: EmailConnection) => {
    // All connections sync automatically
    Alert.alert(
      'Auto-Sync Active',
      connection.auth_type === 'forwarding'
        ? 'iCloud receipts import automatically via email forwarding!\n\nNo manual sync needed.'
        : 'Receipts import automatically in real-time!\n\nNo manual sync needed.'
    );
  };

  const handleDisconnect = (connection: EmailConnection) => {
    Alert.alert(
      'Disconnect Email?',
      `Disconnect ${connection.email}?\n\nPreviously imported transactions will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const success = await emailImportService.disconnectEmail(
              connection.id,
              connection.auth_type
            );
            if (success) {
              loadConnectedEmails();
            } else {
              Alert.alert('Error', 'Could not disconnect. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ============================================
  // ICLOUD FORWARDING HANDLERS
  // ============================================
  const handleCopyAddress = async () => {
    if (!forwardingAddress) return;
    try {
      const ExpoClipboard = require('expo-clipboard');
      await ExpoClipboard.setStringAsync(forwardingAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Native module not available - text is already selectable for long-press copy
      Alert.alert('Copy Address', forwardingAddress, [{ text: 'OK' }]);
    }
  };

  const handleSendTestEmail = () => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const subject = encodeURIComponent('SpendTrak Test Receipt');
    const body = encodeURIComponent(
      `Test receipt\n\nStore: Test Store\nAmount: $10.00\nDate: ${today}\n\nThis is a test receipt for SpendTrak.`
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  const formatForwardingTime = () => {
    if (!forwardingLastEmail) return null;
    const date = new Date(forwardingLastEmail);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderProviderSelection = () => (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
      <Text style={styles.sectionTitle}>
        {connectedEmails.length > 0 ? 'Add Another Email' : 'Select Your Email Provider'}
      </Text>
      <View style={styles.providersGrid}>
        {Object.values(EMAIL_PROVIDERS).map((provider) => (
          <EmailProviderCard
            key={provider.id}
            provider={provider}
            onSelect={() => handleProviderSelect(provider)}
            isConnected={connectedEmails.some((c) => c.provider === provider.id)}
            isOAuth={!!provider.useOAuth}
            connectedCount={connectedEmails.filter((c) => c.provider === provider.id).length}
          />
        ))}
      </View>

      {/* Real-time highlight */}
      <View style={styles.oauthNote}>
        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#00FF88" />
        <Text style={styles.oauthNoteText}>
          All providers connect instantly and import receipts in real-time!
        </Text>
      </View>
    </Animated.View>
  );

  const renderICloudForwarding = () => {
    const statusTime = formatForwardingTime();
    const isActive = !!forwardingLastEmail;

    return (
      <Animated.View entering={FadeInUp.duration(300)} style={styles.section}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedProvider(null)}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#888" />
          <Text style={styles.backText}>Choose Different Provider</Text>
        </TouchableOpacity>

        <View style={styles.selectedHeader}>
          <View style={[styles.selectedIcon, { borderColor: '#555555' }]}>
            <MaterialCommunityIcons name="apple" size={36} color="#555555" />
          </View>
          <View>
            <Text style={styles.selectedTitle}>iCloud Mail</Text>
            <Text style={styles.selectedSubtitle}>Forward receipts automatically</Text>
          </View>
        </View>

        {/* Status indicator */}
        <View style={styles.fwdStatusRow}>
          <View
            style={[
              styles.fwdStatusDot,
              { backgroundColor: isActive ? '#00FF88' : '#FF6B6B' },
            ]}
          />
          <Text style={styles.fwdStatusText}>
            {isActive
              ? `Connected (Last email: ${statusTime})`
              : 'Not Connected (No emails received yet)'}
          </Text>
        </View>

        {/* Forwarding address */}
        <View style={styles.fwdAddressSection}>
          <Text style={styles.fwdAddressLabel}>Your Personal Forwarding Address</Text>
          <TouchableOpacity
            style={styles.fwdAddressBox}
            onPress={handleCopyAddress}
            activeOpacity={0.7}
          >
            <Text style={styles.fwdAddressText} selectable numberOfLines={1}>
              {forwardingAddress || 'Loading...'}
            </Text>
            <View style={styles.fwdCopyIcon}>
              <MaterialCommunityIcons
                name={copied ? 'check-circle' : 'content-copy'}
                size={22}
                color={copied ? '#00FF88' : '#888'}
              />
            </View>
          </TouchableOpacity>
          <Text style={[styles.fwdCopyHint, copied && { color: '#00FF88' }]}>
            {copied ? 'Copied!' : 'Tap to copy \u2022 Long-press to select'}
          </Text>
        </View>

        {/* Setup instructions */}
        <View style={styles.fwdStepsContainer}>
          <Text style={styles.fwdStepsTitle}>Setup Instructions</Text>

          <View style={styles.fwdStep}>
            <View style={styles.fwdStepHeader}>
              <View style={styles.fwdStepNumber}>
                <Text style={styles.fwdStepNumberText}>1</Text>
              </View>
              <Text style={styles.fwdStepLabel}>Copy Your Address</Text>
            </View>
            <Text style={styles.fwdStepBody}>
              Tap the address above to copy it to your clipboard
            </Text>
          </View>

          <View style={styles.fwdStep}>
            <View style={styles.fwdStepHeader}>
              <View style={styles.fwdStepNumber}>
                <Text style={styles.fwdStepNumberText}>2</Text>
              </View>
              <Text style={styles.fwdStepLabel}>Open iCloud Mail Rules</Text>
            </View>
            <Text style={styles.fwdStepBody}>
              {'Go to iCloud.com and sign in\nClick the "Mail" app\nClick the gear icon (\u2699\uFE0F) at bottom left\nSelect "Preferences" or "Settings"\nClick the "Rules" tab'}
            </Text>
          </View>

          <View style={styles.fwdStep}>
            <View style={styles.fwdStepHeader}>
              <View style={styles.fwdStepNumber}>
                <Text style={styles.fwdStepNumberText}>3</Text>
              </View>
              <Text style={styles.fwdStepLabel}>Create Filtering Rule</Text>
            </View>
            <Text style={styles.fwdStepBody}>
              {'Click "Add a Rule" and set it up like this:'}
            </Text>

            {/* Rule visual guide */}
            <View style={styles.fwdRuleBox}>
              <Text style={styles.fwdRuleTitle}>SpendTrak Receipts</Text>

              <View style={styles.fwdRuleSection}>
                <Text style={styles.fwdRuleSectionLabel}>
                  {'If '}
                  <Text style={styles.fwdRuleHighlight}>any</Text>
                  {' of the following conditions are met:'}
                </Text>
                <Text style={styles.fwdRuleImportant}>
                  {'Change "all" to "any" \u2014 this is important!'}
                </Text>
              </View>

              <View style={styles.fwdRuleConditions}>
                {['a', 'e', 'i', 'o', 'u'].map((vowel) => (
                  <View key={vowel} style={styles.fwdRuleRow}>
                    <Text style={styles.fwdRuleField}>Subject</Text>
                    <Text style={styles.fwdRuleOp}>contains</Text>
                    <Text style={styles.fwdRuleValue}>{vowel}</Text>
                  </View>
                ))}
                <Text style={styles.fwdRuleConditionHint}>
                  {'Use the "+" button to add each condition'}
                </Text>
              </View>

              <View style={styles.fwdRuleSection}>
                <Text style={styles.fwdRuleSectionLabel}>Then:</Text>
                <View style={styles.fwdRuleRow}>
                  <Text style={styles.fwdRuleField}>Forward to</Text>
                  <Text style={styles.fwdRuleValue} numberOfLines={1}>
                    {forwardingAddress || 'your address'}
                  </Text>
                </View>
              </View>

              <Text style={styles.fwdRuleDone}>{'Click "Done" to save'}</Text>
            </View>
          </View>

          {/* AI filtering note */}
          <View style={styles.fwdAINote}>
            <MaterialCommunityIcons name="robot" size={18} color="#00FF88" />
            <Text style={styles.fwdAINoteText}>
              {'This rule catches virtually all real emails. Our AI then analyzes each one and only saves actual receipts \u2014 everything else is discarded automatically.'}
            </Text>
          </View>

          <View style={styles.fwdStep}>
            <View style={styles.fwdStepHeader}>
              <View style={styles.fwdStepNumber}>
                <Text style={styles.fwdStepNumberText}>4</Text>
              </View>
              <Text style={styles.fwdStepLabel}>Test It!</Text>
            </View>
            <Text style={styles.fwdStepBody}>
              Send a test receipt to your iCloud email and check SpendTrak
            </Text>
          </View>
        </View>

        {/* Test email button */}
        <TouchableOpacity style={styles.fwdTestButton} onPress={handleSendTestEmail}>
          <MaterialCommunityIcons name="email-edit" size={22} color="#000" />
          <Text style={styles.fwdTestButtonText}>Send Test Email</Text>
        </TouchableOpacity>

        {/* Security note */}
        <View style={styles.securityNote}>
          <MaterialCommunityIcons name="shield-check" size={18} color="#00FF88" />
          <Text style={styles.securityText}>
            No password needed. Emails are processed securely and only receipt data is saved to your account. Non-receipts are never stored.
          </Text>
        </View>
      </Animated.View>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  // Premium gate: Email auto-import is a premium-only AI feature
  if (!hasPremiumAccess()) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header
          title={t('settings.connectEmail')}
          showBack
          onBack={() => triggerBlackout(() => router.back())}
        />
        <View style={styles.premiumGateContainer}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="email-lock" size={44} color="#FFD700" />
          </View>
          <Text style={styles.premiumGateTitle}>Premium Feature</Text>
          <Text style={styles.premiumGateSubtitle}>
            Email auto-import uses AI to scan and extract receipt data from your emails.
            Upgrade to Premium to unlock this feature.
          </Text>
          <TouchableOpacity
            style={styles.premiumUpgradeButton}
            onPress={() => {
              triggerBlackout(() => router.push('/settings/upgrade' as any));
            }}
          >
            <Text style={styles.premiumUpgradeText}>Upgrade to Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.premiumBackButton}
            onPress={() => triggerBlackout(() => router.back())}
          >
            <Text style={styles.premiumBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header
          title={t('settings.connectEmail')}
          showBack
          onBack={() => triggerBlackout(() => router.back())}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF88" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // OAuth loading overlay
  if (connecting && !selectedProvider) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header
          title={t('settings.connectEmail')}
          showBack
          onBack={() => triggerBlackout(() => router.back())}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF88" />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title={t('settings.connectEmail')}
        showBack
        onBack={() => triggerBlackout(() => router.back())}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00FF88"
            />
          }
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="email-sync" size={44} color="#00FF88" />
            </View>
            <Text style={styles.title}>Auto-Import Receipts</Text>
            <Text style={styles.subtitle}>
              Connect your email and we'll automatically scan for receipts,
              invoices, and order confirmations to add them as transactions.
            </Text>
          </Animated.View>

          {connectedEmails.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Connected Emails</Text>
              {connectedEmails.map((conn) => (
                <ConnectedEmailCard
                  key={conn.id}
                  connection={conn}
                  onDisconnect={() => handleDisconnect(conn)}
                />
              ))}
            </Animated.View>
          )}

          {!selectedProvider
            ? renderProviderSelection()
            : selectedProvider.useForwarding
              ? renderICloudForwarding()
              : null}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,255,136,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: '#fff',
    marginBottom: 16,
  },

  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  oauthNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 10,
    gap: 8,
  },
  oauthNoteText: {
    color: '#00FF88',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    flex: 1,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  backText: {
    color: '#888',
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    marginLeft: 8,
  },

  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  selectedTitle: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  selectedSubtitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: '#888',
    marginTop: 2,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(0,255,136,0.06)',
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    color: '#888',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    flex: 1,
    lineHeight: 20,
  },

  // Premium gate styles
  premiumGateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  premiumGateTitle: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.bold,
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  premiumGateSubtitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  premiumUpgradeButton: {
    backgroundColor: '#00FF88',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  premiumUpgradeText: {
    color: '#000',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
  premiumBackButton: {
    paddingVertical: 12,
  },
  premiumBackText: {
    color: '#888',
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
  },

  // iCloud Forwarding styles
  fwdStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    marginBottom: 20,
  },
  fwdStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  fwdStatusText: {
    color: '#aaa',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  fwdAddressSection: {
    marginBottom: 24,
  },
  fwdAddressLabel: {
    color: '#aaa',
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    marginBottom: 10,
  },
  fwdAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  fwdAddressText: {
    flex: 1,
    color: '#00FF88',
    fontSize: FontSize.body,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fwdCopyIcon: {
    marginLeft: 12,
    padding: 4,
  },
  fwdCopyHint: {
    color: '#666',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    marginTop: 8,
    textAlign: 'center',
  },
  fwdStepsContainer: {
    marginBottom: 24,
  },
  fwdStepsTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    marginBottom: 16,
  },
  fwdStep: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fwdStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fwdStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fwdStepNumberText: {
    color: '#000',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
  },
  fwdStepLabel: {
    color: '#fff',
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  fwdStepBody: {
    color: '#888',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    paddingLeft: 36,
  },
  fwdRuleBox: {
    marginTop: 12,
    marginLeft: 36,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fwdRuleTitle: {
    color: '#fff',
    fontSize: FontSize.body,
    fontFamily: FontFamily.bold,
    marginBottom: 12,
  },
  fwdRuleSection: {
    marginBottom: 10,
  },
  fwdRuleSectionLabel: {
    color: '#aaa',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  fwdRuleHighlight: {
    color: '#00FF88',
    fontFamily: FontFamily.bold,
  },
  fwdRuleImportant: {
    color: '#FFD700',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  fwdRuleConditions: {
    marginBottom: 10,
  },
  fwdRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
    gap: 8,
  },
  fwdRuleField: {
    color: '#aaa',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
  },
  fwdRuleOp: {
    color: '#666',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
  },
  fwdRuleValue: {
    color: '#00FF88',
    fontSize: FontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  fwdRuleConditionHint: {
    color: '#666',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    fontStyle: 'italic',
  },
  fwdRuleDone: {
    color: '#888',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    marginTop: 6,
    textAlign: 'center',
  },
  fwdAINote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.15)',
  },
  fwdAINoteText: {
    color: '#ccc',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    flex: 1,
    lineHeight: 20,
  },
  fwdTestButton: {
    backgroundColor: '#00FF88',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  fwdTestButtonText: {
    color: '#000',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
});
