// SPENDTRAK CINEMATIC EDITION - Help & Support Screen
// Expandable FAQ accordion with comprehensive content
import React, { useState, useCallback, memo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, LayoutAnimation, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Header } from '../../src/components/navigation';
import { HelpIcon, EmailIcon, ChevronRightIcon, ChevronDownIcon } from '../../src/components/icons';
import { useTranslation } from '../../src/context/LanguageContext';
import { useTransition } from '../../src/context/TransitionContext';
import { lightTap } from '../../src/utils/haptics';

// FAQ Item Component with expand/collapse animation
interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

const FAQItem: React.FC<FAQItemProps> = memo(({ question, answer, isExpanded, onToggle, isLast }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 200 });
  }, [isExpanded]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    lightTap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={[styles.faqItem, !isLast && styles.itemBorder]}>
      <Pressable
        style={styles.questionRow}
        onPress={handlePress}
        android_ripple={{ color: Colors.transparent.neon10 }}
      >
        <GradientText variant="bright" style={styles.question}>{question}</GradientText>
        <Animated.View style={iconStyle}>
          <ChevronDownIcon size={20} color={Colors.text.tertiary} />
        </Animated.View>
      </Pressable>
      {isExpanded && (
        <View style={styles.answerContainer}>
          <GradientText variant="muted" style={styles.answer}>{answer}</GradientText>
        </View>
      )}
    </View>
  );
});

FAQItem.displayName = 'FAQItem';

// FAQ Category Component
interface FAQCategoryProps {
  title: string;
  faqs: Array<{ q: string; a: string }>;
  expandedIndex: number | null;
  onToggle: (index: number) => void;
  startIndex: number;
}

const FAQCategory: React.FC<FAQCategoryProps> = memo(({ title, faqs, expandedIndex, onToggle, startIndex }) => {
  return (
    <>
      <GradientText variant="muted" style={styles.sectionLabel}>{title}</GradientText>
      <GlassCard variant="default" style={styles.listCard}>
        {faqs.map((faq, index) => {
          const globalIndex = startIndex + index;
          return (
            <FAQItem
              key={globalIndex}
              question={faq.q}
              answer={faq.a}
              isExpanded={expandedIndex === globalIndex}
              onToggle={() => onToggle(globalIndex)}
              isLast={index === faqs.length - 1}
            />
          );
        })}
      </GlassCard>
    </>
  );
});

FAQCategory.displayName = 'FAQCategory';

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Comprehensive FAQs organized by category
  const gettingStartedFaqs = [
    {
      q: t('help.faqGettingStartedQ1') || 'How do I add a transaction?',
      a: t('help.faqGettingStartedA1') || 'Tap the + button at the bottom of the home screen. You can either manually enter transaction details or scan a receipt using your camera. The app will automatically categorize your expense based on the merchant name.',
    },
    {
      q: t('help.faqGettingStartedQ2') || 'How do I set up my first budget?',
      a: t('help.faqGettingStartedA2') || 'Go to Settings > Budgets and tap "Add Budget". Select a category (like Food & Dining), set your monthly limit, and optionally enable alerts when you reach 80% or 100% of your budget. The app will track your spending against this limit automatically.',
    },
    {
      q: t('help.faqGettingStartedQ3') || 'Can I import transactions from my bank?',
      a: t('help.faqGettingStartedA3') || 'Currently, you can add transactions manually or by scanning receipts. Bank import features are planned for a future update. You can also use the "Connect Email" feature to automatically import receipts from your inbox.',
    },
  ];

  const featuresFaqs = [
    {
      q: t('help.faqFeaturesQ1') || 'What is the AI Consultant feature?',
      a: t('help.faqFeaturesQ1A') || 'The AI Consultant analyzes your spending patterns and provides personalized financial advice. It can identify areas where you might be overspending, suggest budget adjustments, and help you reach your savings goals faster. Access it from the home screen by tapping the QUANTUM character.',
    },
    {
      q: t('help.faqFeaturesQ2') || 'How do subscriptions tracking work?',
      a: t('help.faqFeaturesQ2A') || 'Go to Settings > Subscriptions to add your recurring payments. Enter the service name, amount, and billing cycle. The app will remind you before renewal dates and show you your total monthly subscription costs. You can also mark subscriptions as paused or cancelled.',
    },
    {
      q: t('help.faqFeaturesQ3') || 'What are Goals and how do I use them?',
      a: t('help.faqFeaturesQ3A') || 'Goals help you save for specific targets like a vacation, emergency fund, or new purchase. Go to Settings > Goals, create a goal with your target amount and deadline. You can add money to goals manually or set up automatic contributions. The app tracks your progress with visual indicators.',
    },
    {
      q: t('help.faqFeaturesQ4') || 'How does receipt scanning work?',
      a: t('help.faqFeaturesQ4A') || 'Tap the + button and select "Scan Receipt". Point your camera at the receipt and the app uses OCR (Optical Character Recognition) to extract the merchant name, date, and total amount. Review the detected information and make any corrections before saving.',
    },
    {
      q: t('help.faqFeaturesQ5') || 'What is the Daily Limit feature?',
      a: t('help.faqFeaturesQ5A') || 'Daily Limit helps you control impulsive spending by setting a maximum amount you can spend each day. Go to Settings > Daily Limit to enable it. When you approach or exceed your limit, the app will alert you to help you stay on track.',
    },
  ];

  const dataSecurityFaqs = [
    {
      q: t('help.faqSecurityQ1') || 'Is my financial data secure?',
      a: t('help.faqSecurityQ1A') || 'Yes, your data is encrypted both in transit and at rest. We use industry-standard AES-256 encryption. Your data is stored securely and we never sell your information to third parties. You can also enable biometric authentication for extra security.',
    },
    {
      q: t('help.faqSecurityQ2') || 'Can I export my data?',
      a: t('help.faqSecurityQ2A') || 'Yes! Go to Settings > Export to download your data. You can export as CSV (for spreadsheets) or PDF (for reports). Choose a date range or export all your data. This is useful for tax purposes, sharing with financial advisors, or creating backups.',
    },
    {
      q: t('help.faqSecurityQ3') || 'How do I delete my account and data?',
      a: t('help.faqSecurityQ3A') || 'Go to Settings, scroll to the bottom, and tap "Delete Account". This will permanently delete all your data from our servers. You\'ll need to confirm this action as it cannot be undone. Consider exporting your data first if you want to keep records.',
    },
  ];

  const troubleshootingFaqs = [
    {
      q: t('help.faqTroubleshootQ1') || 'Why isn\'t my receipt scanning correctly?',
      a: t('help.faqTroubleshootQ1A') || 'For best results: ensure good lighting, hold the camera steady, make sure the entire receipt is visible, and avoid glare or shadows. Crumpled or faded receipts may not scan well. You can always manually edit the extracted information.',
    },
    {
      q: t('help.faqTroubleshootQ2') || 'My transactions aren\'t syncing across devices',
      a: t('help.faqTroubleshootQ2A') || 'Make sure you\'re signed in with the same account on all devices and have an active internet connection. Try pulling down on the transaction list to refresh. If issues persist, try signing out and back in.',
    },
    {
      q: t('help.faqTroubleshootQ3') || 'How do I change my currency?',
      a: t('help.faqTroubleshootQ3A') || 'Go to Settings > Currency to select your preferred currency. The app supports 150+ currencies with real-time exchange rates. Note that changing currency will display all amounts in the new currency but won\'t convert historical transaction values.',
    },
    {
      q: t('help.faqTroubleshootQ4') || 'The app is running slowly, what can I do?',
      a: t('help.faqTroubleshootQ4A') || 'Try closing and reopening the app. If you have many transactions, the app may take a moment to load. Ensure you have enough storage space on your device. If problems persist, try clearing the app cache from your device settings.',
    },
  ];

  const handleToggle = useCallback((index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  }, []);

  // Calculate start indices for each category
  const gettingStartedStart = 0;
  const featuresStart = gettingStartedFaqs.length;
  const securityStart = featuresStart + featuresFaqs.length;
  const troubleshootingStart = securityStart + dataSecurityFaqs.length;

  return (
    <View style={styles.container}>
      <Header title={t('settings.helpAndSupport')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
        {/* Tap to expand hint */}
        <View style={styles.hintContainer}>
          <GradientText variant="muted" style={styles.hintText}>
            {t('help.tapToExpand') || 'Tap a question to see the answer'}
          </GradientText>
        </View>

        {/* Getting Started */}
        <FAQCategory
          title={t('help.gettingStarted') || 'Getting Started'}
          faqs={gettingStartedFaqs}
          expandedIndex={expandedIndex}
          onToggle={handleToggle}
          startIndex={gettingStartedStart}
        />

        {/* Features & How-To */}
        <FAQCategory
          title={t('help.featuresHowTo') || 'Features & How-To'}
          faqs={featuresFaqs}
          expandedIndex={expandedIndex}
          onToggle={handleToggle}
          startIndex={featuresStart}
        />

        {/* Data & Security */}
        <FAQCategory
          title={t('help.dataSecurity') || 'Data & Security'}
          faqs={dataSecurityFaqs}
          expandedIndex={expandedIndex}
          onToggle={handleToggle}
          startIndex={securityStart}
        />

        {/* Troubleshooting */}
        <FAQCategory
          title={t('help.troubleshooting') || 'Troubleshooting'}
          faqs={troubleshootingFaqs}
          expandedIndex={expandedIndex}
          onToggle={handleToggle}
          startIndex={troubleshootingStart}
        />

        {/* Contact Us */}
        <GradientText variant="muted" style={styles.sectionLabel}>{t('settings.contactUs')}</GradientText>

        <GlassCard variant="default" style={styles.listCard}>
          <Pressable
            style={styles.contactItem}
            onPress={() => lightTap()}
            android_ripple={{ color: Colors.transparent.neon10 }}
          >
            <View style={styles.contactIcon}>
              <EmailIcon size={20} color={Colors.neon} />
            </View>
            <View style={styles.contactInfo}>
              <GradientText variant="bright" style={styles.contactTitle}>{t('help.emailSupport') || 'Email Support'}</GradientText>
              <GradientText variant="muted" style={styles.contactText}>support@spendtrak.app</GradientText>
            </View>
            <ChevronRightIcon size={20} color={Colors.text.tertiary} />
          </Pressable>
        </GlassCard>

        {/* Still need help */}
        <View style={styles.footerNote}>
          <GradientText variant="muted" style={styles.footerText}>
            {t('help.stillNeedHelp') || "Can't find what you're looking for? Email us and we'll respond within 24 hours."}
          </GradientText>
        </View>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  hintContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  hintText: {
    fontSize: FontSize.caption,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  listCard: { padding: 0, overflow: 'hidden' },
  faqItem: {
    overflow: 'hidden',
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    minHeight: 56,
  },
  question: {
    flex: 1,
    marginRight: Spacing.md,
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  answerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: 0,
  },
  answer: {
    lineHeight: 22,
    fontSize: FontSize.body,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.transparent.neon10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  contactText: {
    fontSize: FontSize.caption,
  },
  footerNote: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
});
